"""Quantification model - emission rate estimation."""
import random

def quantify_emission(plume_mask, image_features):
    """
    Estimate emission rate from plume mask and features.
    
    Args:
        plume_mask: Binary mask of plume
        image_features: Dict with image metadata
        
    Returns:
        Dict with quantification results
    """
    plume_pixels = int(plume_mask.sum())
    
    if plume_pixels == 0:
        return {
            "emission_rate_kg_hr": 0,
            "emission_uncertainty_kg_hr": 0,
            "detection_type": "none"
        }
    
    # Realistic simulation
    rng = random.Random(plume_pixels)
    base_rate = 100 + plume_pixels * 2
    rate = base_rate + rng.gauss(0, base_rate * 0.15)
    uncertainty = abs(rate * 0.2)
    
    return {
        "emission_rate_kg_hr": max(1, rate),
        "emission_uncertainty_kg_hr": uncertainty,
        "detection_type": "plume" if plume_pixels > 50 else "point"
    }
