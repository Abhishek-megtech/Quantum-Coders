"""Inference pipeline - full AI detection workflow."""
import time
import numpy as np
from app.models.segmentation import segment_methane_plume
from app.models.quantification import quantify_emission
from app.models.attribution import attribute_source
from app.pipeline.simulation import generate_global_emission_heatmap

class DetectionPipeline:
    def __init__(self):
        self.facilities = generate_global_emission_heatmap()
    
    async def run_inference(self, bbox_str, date=None, threshold=0.45):
        """Run full detection pipeline."""
        t_start = time.perf_counter()
        
        # Parse bbox
        parts = bbox_str.split(',')
        lat1, lon1, lat2, lon2 = map(float, parts)
        
        # Simulate satellite image (H, W, C)
        image = np.random.rand(512, 512, 4).astype(np.float32)
        
        # Segmentation
        t_seg = time.perf_counter()
        mask = segment_methane_plume(image, threshold)
        seg_time = (time.perf_counter() - t_seg) * 1000
        
        # Quantification
        t_quant = time.perf_counter()
        quant = quantify_emission(mask, {"date": date})
        quant_time = (time.perf_counter() - t_quant) * 1000
        
        # Attribution
        t_attr = time.perf_counter()
        center_lat = (lat1 + lat2) / 2
        center_lon = (lon1 + lon2) / 2
        
        # Check if this is a super-emitter
        is_super = quant["emission_rate_kg_hr"] > 1200
        
        attribution = attribute_source(center_lat, center_lon, quant["emission_rate_kg_hr"])
        attr_time = (time.perf_counter() - t_attr) * 1000
        
        plume_detected = mask.sum() > 100
        detection_confidence = float(mask.mean()) if plume_detected else 0.0
        
        # Severity classification
        rate = quant["emission_rate_kg_hr"]
        if rate > 1000:
            severity = "CRITICAL"
        elif rate > 500:
            severity = "HIGH"
        elif rate > 100:
            severity = "MEDIUM"
        elif rate > 0:
            severity = "MEDIUM"
        else:
            severity = "NONE"
        
        total_time = time.perf_counter() - t_start
        
        return {
            # Detection result
            "detected": plume_detected,
            "severity": severity,
            "detection_confidence": round(detection_confidence, 3),
            "cloud_fraction": 0.15,
            
            # Plume geometry
            "plume_mask_shape": [512, 512],
            "plume_pixel_count": int(mask.sum()),
            "plume_centroid": {"lat": round(center_lat, 6), "lon": round(center_lon, 6)},
            
            # Quantification  
            "emission_rate_kg_hr": round(quant["emission_rate_kg_hr"], 1),
            "emission_uncertainty_kg_hr": round(quant["emission_uncertainty_kg_hr"], 1),
            "quantification_confidence": 0.85,
            "is_super_emitter": is_super,
            
            # Attribution
            "attribution": {
                "facility_id": attribution["facility_id"],
                "facility_name": attribution["facility_name"],
                "facility_type": attribution["facility_type"],
                "distance_km": round(attribution["distance_km"], 2),
                "attribution_confidence": round(attribution["attribution_confidence"], 3)
            },
            
            # Wind
            "wind": {
                "speed_ms": 5.2,
                "direction_deg": 270
            },
            
            # Timing
            "pipeline_timing_ms": {
                "segmentation": round(seg_time),
                "quantification": round(quant_time),
                "attribution": round(attr_time),
                "total": round(total_time * 1000)
            }
        }


# Global pipeline instance
pipeline = DetectionPipeline()

async def detect_methane(bbox: str, date: str = None, simulate: bool = False, threshold: float = 0.45):
    """Main detection endpoint handler."""
    if simulate:
        # Return simulated detection
        parts = bbox.split(',')
        lat1, lon1, lat2, lon2 = map(float, parts)
        center_lat = (lat1 + lat2) / 2
        center_lon = (lon1 + lon2) / 2
        
        # Simulate based on location
        import random
        rng = random.Random((center_lat, center_lon))
        rate = 400 + rng.uniform(100, 1200)
        is_super = rate > 1200
        
        if rate > 1000:
            severity = "CRITICAL"
        elif rate > 500:
            severity = "HIGH"
        else:
            severity = "MEDIUM"
        
        return {
            "detected": True,
            "severity": severity,
            "detection_confidence": 0.92,
            "cloud_fraction": 0.08,
            "plume_mask_shape": [512, 512],
            "plume_pixel_count": 450,
            "plume_centroid": {"lat": round(center_lat, 6), "lon": round(center_lon, 6)},
            "emission_rate_kg_hr": round(rate, 1),
            "emission_uncertainty_kg_hr": round(rate * 0.2, 1),
            "quantification_confidence": 0.88,
            "is_super_emitter": is_super,
            "attribution": {
                "facility_id": "FAC_001",
                "facility_name": "Oil/Gas Operations",
                "facility_type": "oil_well",
                "distance_km": 2.5,
                "attribution_confidence": 0.87
            },
            "wind": {"speed_ms": 4.8, "direction_deg": 280},
            "pipeline_timing_ms": {
                "segmentation": 120,
                "quantification": 85,
                "attribution": 95,
                "total": 300
            }
        }
    else:
        return await pipeline.run_inference(bbox, date, threshold)
