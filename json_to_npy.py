#!/usr/bin/env python3
"""
Convert JSON detection results back to NPY visualization images
"""

import json
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
from scipy import ndimage

def json_to_npy_visualization(json_path, original_image_path=None, output_dir='outputs/'):
    """
    Convert JSON detection results to NPY visualization images
    
    Args:
        json_path: Path to methane_detection_*.json
        original_image_path: (Optional) Original .npy image to overlay
        output_dir: Directory to save NPY outputs
    """
    
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # Load JSON results
    with open(json_path, 'r') as f:
        results = json.load(f)
    
    image_shape = results['image_shape']  # [bands, height, width]
    height = image_shape[1]
    width = image_shape[2]
    
    print(f"Creating visualizations from JSON results...")
    print(f"Image shape: {height}×{width}")
    
    # 1. Create plume segmentation mask
    plume_mask = np.zeros((height, width), dtype=np.uint8)
    
    for i, plume in enumerate(results['plumes']):
        y, x = int(plume['location']['y']), int(plume['location']['x'])
        area = plume['area_pixels']
        
        # Create circular mask around plume location
        yy, xx = np.ogrid[:height, :width]
        radius = np.sqrt(area / np.pi)
        mask = (yy - y)**2 + (xx - x)**2 <= radius**2
        plume_mask[mask] = i + 1
    
    # Save segmentation mask
    mask_path = output_dir / 'plume_segmentation_mask.npy'
    np.save(mask_path, plume_mask)
    print(f"✅ Saved: {mask_path}")
    
    # 2. Create intensity map
    intensity_map = np.zeros((height, width), dtype=np.float32)
    
    for plume in results['plumes']:
        y, x = int(plume['location']['y']), int(plume['location']['x'])
        intensity = plume['intensity_mean']
        area = plume['area_pixels']
        
        yy, xx = np.ogrid[:height, :width]
        radius = np.sqrt(area / np.pi)
        mask = (yy - y)**2 + (xx - x)**2 <= radius**2
        intensity_map[mask] = intensity
    
    # Save intensity map
    intensity_path = output_dir / 'plume_intensity_map.npy'
    np.save(intensity_path, intensity_map)
    print(f"✅ Saved: {intensity_path}")
    
    # 3. Create emission rate map
    emission_map = np.zeros((height, width), dtype=np.float32)
    
    for plume in results['plumes']:
        y, x = int(plume['location']['y']), int(plume['location']['x'])
        emission = plume['emission_kg_hr']
        area = plume['area_pixels']
        
        yy, xx = np.ogrid[:height, :width]
        radius = np.sqrt(area / np.pi)
        mask = (yy - y)**2 + (xx - x)**2 <= radius**2
        emission_map[mask] = emission
    
    # Save emission map
    emission_path = output_dir / 'plume_emission_map.npy'
    np.save(emission_path, emission_map)
    print(f"✅ Saved: {emission_path}")
    
    # 4. Create confidence map
    confidence_map = np.zeros((height, width), dtype=np.float32)
    
    for plume in results['plumes']:
        y, x = int(plume['location']['y']), int(plume['location']['x'])
        confidence = plume['confidence']
        area = plume['area_pixels']
        
        yy, xx = np.ogrid[:height, :width]
        radius = np.sqrt(area / np.pi)
        mask = (yy - y)**2 + (xx - x)**2 <= radius**2
        confidence_map[mask] = confidence
    
    # Save confidence map
    confidence_path = output_dir / 'plume_confidence_map.npy'
    np.save(confidence_path, confidence_map)
    print(f"✅ Saved: {confidence_path}")
    
    # 5. If original image provided, create overlay
    if original_image_path:
        print(f"\nCreating overlay visualization...")
        original = np.load(original_image_path)
        
        if original.ndim == 3 and original.shape[0] >= 3:
            # Create RGB from first 3 bands
            rgb = original[:3].transpose(1, 2, 0)
            rgb = (rgb - rgb.min()) / (rgb.max() - rgb.min())
            
            # Create overlay
            overlay = rgb.copy()
            plume_pixels = plume_mask > 0
            overlay[plume_pixels] = [1, 0, 0]  # Red for plumes
            
            # Save overlay
            overlay_path = output_dir / 'plume_overlay_rgb.npy'
            np.save(overlay_path, overlay)
            print(f"✅ Saved overlay: {overlay_path}")
    
    # 6. Create combined visualization array (all maps stacked)
    combined = np.stack([
        plume_mask.astype(np.float32),
        intensity_map,
        emission_map,
        confidence_map
    ], axis=0)
    
    combined_path = output_dir / 'all_maps_combined.npy'
    np.save(combined_path, combined)
    print(f"✅ Saved combined: {combined_path} (shape: {combined.shape})")
    
    print("\n" + "="*70)
    print("📊 SUMMARY")
    print("="*70)
    print(f"Generated files:")
    print(f"  • plume_segmentation_mask.npy - Where plumes are (0-N)")
    print(f"  • plume_intensity_map.npy - Intensity values per plume")
    print(f"  • plume_emission_map.npy - Emission rates (kg/hr)")
    print(f"  • plume_confidence_map.npy - Detection confidence")
    print(f"  • all_maps_combined.npy - All 4 maps stacked")
    if original_image_path:
        print(f"  • plume_overlay_rgb.npy - RGB overlay with plumes")
    print(f"\nLocation: {output_dir}/")
    
    return {
        'segmentation': plume_mask,
        'intensity': intensity_map,
        'emission': emission_map,
        'confidence': confidence_map,
        'combined': combined
    }


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 json_to_npy.py <json_path> [original_image.npy]")
        print("\nExample:")
        print("  python3 json_to_npy.py outputs/methane_detection_test_satellite.json data/test_satellite.npy")
        sys.exit(1)
    
    json_path = sys.argv[1]
    original_image = sys.argv[2] if len(sys.argv) > 2 else None
    
    json_to_npy_visualization(json_path, original_image)
