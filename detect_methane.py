#!/usr/bin/env python3
"""
METHANE DETECTION - Simple & Direct
Input: Path to hyperspectral image (.npy file)
Output: Detected methane plumes with locations, areas, and emission rates

Usage:
    python3 detect_methane.py <image_path>
    
    Or programmatically:
    from detect_methane import MethaneDetector
    
    detector = MethaneDetector()
    results = detector.detect('path/to/image.npy')
    print(results)
"""

import numpy as np
import sys
from pathlib import Path
from scipy import ndimage
import logging
import json

project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from agents.data_processing_agent import DataProcessingAgent
from agents.segmentation_agent import CloudMaskingSegmentationAgent
from agents.attribution_agent import AttributionQuantificationAgent
from config.settings import MODEL_CONFIG

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class MethaneDetector:
    """Direct methane detection from hyperspectral images"""
    
    def __init__(self, device='cpu'):
        """Initialize detector with all agents"""
        logger.info("🔬 Initializing Methane Detector...")
        
        self.device = device
        
        # Initialize agents
        self.data_agent = DataProcessingAgent(config={
            'mean': 0.5,
            'std': 0.2,
            'percentile_clip': (2, 98),
        })
        
        self.segmentation_agent = CloudMaskingSegmentationAgent(
            model_config=MODEL_CONFIG['unet'],
            device=device
        )
        
        self.attribution_agent = AttributionQuantificationAgent(
            model_config={**MODEL_CONFIG['gnn'], **MODEL_CONFIG['pinn']},
            device=device
        )
        
        logger.info("✅ Detector initialized successfully\n")
    
    def detect(self, image_path, output_dir=None):
        """
        Detect methane plumes in hyperspectral image
        
        Args:
            image_path: Path to .npy hyperspectral image
            output_dir: Optional directory to save results JSON
            
        Returns:
            Dict with detection results
        """
        print("\n" + "="*80)
        print("🛰️  METHANE DETECTION PIPELINE")
        print("="*80)
        
        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        # ===== STAGE 1: Data Processing =====
        print("\n[STAGE 1/3] Data Processing & Validation")
        print("-" * 80)
        
        # Load
        logger.info("Loading hyperspectral image...")
        image = self.data_agent.load_hyperspectral_data(str(image_path))
        print(f"✅ Loaded: shape {image.shape} (bands={image.shape[0]}, height={image.shape[1]}, width={image.shape[2]})")
        
        # Validate
        logger.info("Validating data quality...")
        quality = self.data_agent.validate_data_quality(image)
        print(f"✅ Quality Score: {quality['quality_score']:.2f}/1.0")
        print(f"   • Mean: {quality['mean']:.4f}, Std: {quality['std']:.4f}")
        print(f"   • Range: [{quality['min']:.4f}, {quality['max']:.4f}]")
        
        # Normalize
        logger.info("Normalizing data...")
        image_norm, metadata = self.data_agent.normalize_and_prepare(image)
        print(f"✅ Normalized: range [{image_norm.min():.2f}, {image_norm.max():.2f}]")
        
        # ===== STAGE 2: Cloud Masking & Segmentation =====
        print("\n[STAGE 2/3] Cloud Detection & Methane Segmentation")
        print("-" * 80)
        
        # Cloud detection
        logger.info("Detecting clouds...")
        cloud_mask, image_filled = self.segmentation_agent.detect_and_mask_clouds(image_norm)
        cloud_coverage = (cloud_mask.sum() / cloud_mask.size) * 100
        print(f"✅ Cloud coverage: {cloud_coverage:.1f}%")
        
        # Methane segmentation
        logger.info("Detecting methane plumes using SWIR + U-Net hybrid...")
        try:
            segmentation_mask, seg_results = self.segmentation_agent.segment_methane_plumes(
                image_filled, 
                cloud_mask=cloud_mask,
                debug=False
            )
            num_plumes = seg_results['num_plumes']
            print(f"✅ Detected {num_plumes} methane plumes (U-Net + SWIR hybrid)")
        except Exception as e:
            logger.warning(f"U-Net inference failed: {e}. Falling back to SWIR-only...")
            print(f"⚠️  U-Net error, using SWIR physics-based detection only")
            
            # Fallback: SWIR-only detection
            swir1 = image_filled[8] if image_filled.shape[0] > 8 else image_filled[-2]
            swir2 = image_filled[10] if image_filled.shape[0] > 10 else image_filled[-1]
            
            swir1_norm = (swir1 - swir1.min()) / (swir1.max() - swir1.min() + 1e-8)
            swir2_norm = (swir2 - swir2.min()) / (swir2.max() - swir2.min() + 1e-8)
            swir_ratio = (swir1_norm + swir2_norm) / (np.abs(swir1_norm - swir2_norm) + 1e-8)
            
            threshold = np.percentile(swir_ratio, 90)
            segmentation_mask = (swir_ratio > threshold).astype(np.uint8)
            segmentation_mask[cloud_mask > 0.5] = 0
            
            labeled_plumes, num_plumes = ndimage.label(segmentation_mask)
            seg_results = {
                'labeled_plumes': labeled_plumes,
                'num_plumes': num_plumes,
                'segmentation_mask': segmentation_mask,
            }
            print(f"✅ Detected {num_plumes} methane plumes (SWIR physics-based)")
        
        # Calculate plume metrics
        logger.info("Computing plume metrics...")
        plume_properties = self.segmentation_agent.calculate_plume_metrics(
            image_filled, 
            seg_results
        )
        print(f"✅ Extracted metrics for {len(plume_properties)} plumes")
        
        # ===== STAGE 3: Flux Estimation =====
        print("\n[STAGE 3/3] Methane Emission Estimation")
        print("-" * 80)
        
        # Default wind data
        wind_data = {
            'wind_speed': 7.5,
            'wind_direction': 45.0,
            'altitude': 100.0,
            'latitude': 0.0,
            'longitude': 0.0,
        }
        
        # Estimate flux
        logger.info("Estimating methane flux using physics-informed model...")
        flux_estimates = self.attribution_agent.estimate_flux_from_plumes(
            plume_properties,
            wind_data
        )
        
        # Calculate total emission
        total_emission = sum([f.get('emission', 0) for f in flux_estimates])
        print(f"✅ Total methane emission: {total_emission:.1f} kg/hr")
        
        # ===== RESULTS =====
        results = {
            'status': 'success',
            'image_path': str(image_path),
            'image_shape': list(image.shape),
            'num_plumes': num_plumes,
            'cloud_coverage_percent': cloud_coverage,
            'plumes': [],
            'total_emission_kg_hr': total_emission,
            'wind_data': wind_data,
        }
        
        for i, (prop, flux) in enumerate(zip(plume_properties, flux_estimates)):
            plume_info = {
                'plume_id': i,
                'location': {
                    'y': float(prop.get('centroid_y', 0)),
                    'x': float(prop.get('centroid_x', 0)),
                },
                'area_pixels': int(prop.get('area', 0)),
                'intensity_mean': float(prop.get('intensity_mean', 0)),
                'intensity_max': float(prop.get('intensity_max', 0)),
                'emission_kg_hr': float(flux.get('emission', 0)),
                'uncertainty_kg_hr': float(flux.get('uncertainty', 0)),
                'confidence': float(flux.get('confidence', 0)),
            }
            results['plumes'].append(plume_info)
        
        # ===== SUMMARY =====
        print("\n" + "="*80)
        print("📊 DETECTION RESULTS SUMMARY")
        print("="*80)
        print(f"✅ Total Methane Plumes Detected: {num_plumes}")
        print(f"✅ Total Emission: {total_emission:.1f} kg/hr")
        print(f"✅ Cloud Coverage: {cloud_coverage:.1f}%")
        
        if num_plumes > 0:
            print("\n📍 Detected Plumes:")
            for plume in results['plumes']:
                print(f"\n  Plume {plume['plume_id']}:")
                print(f"    • Location: ({plume['location']['y']:.0f}, {plume['location']['x']:.0f})")
                print(f"    • Area: {plume['area_pixels']} pixels")
                print(f"    • Intensity: mean={plume['intensity_mean']:.3f}, max={plume['intensity_max']:.3f}")
                print(f"    • Emission: {plume['emission_kg_hr']:.1f} ± {plume['uncertainty_kg_hr']:.1f} kg/hr")
                print(f"    • Confidence: {plume['confidence']:.1%}")
        else:
            print("\n⚠️  No methane plumes detected in this image")
        
        # Save results
        if output_dir:
            output_dir = Path(output_dir)
            output_dir.mkdir(exist_ok=True)
            
            results_file = output_dir / f"methane_detection_{image_path.stem}.json"
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\n💾 Results saved to: {results_file}")
        
        print("\n" + "="*80 + "\n")
        
        return results


def main():
    """Command-line interface"""
    
    if len(sys.argv) < 2:
        print("Usage: python3 detect_methane.py <image_path> [output_dir]")
        print("\nExample:")
        print("  python3 detect_methane.py data/hyperspectral_image.npy outputs/")
        print("\nHelp:")
        print("  - image_path: Path to .npy hyperspectral image (shape: bands x height x width)")
        print("  - output_dir: (Optional) Directory to save JSON results")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'outputs'
    
    detector = MethaneDetector(device='cpu')
    results = detector.detect(image_path, output_dir=output_dir)
    
    return results


if __name__ == '__main__':
    main()
