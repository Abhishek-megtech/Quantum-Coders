"""Attribution model - facility source identification."""
import random

def attribute_source(plume_center_lat, plume_center_lon, emission_rate):
    """
    Identify probable emission source using GNN-like logic.
    
    Args:
        plume_center_lat: Latitude of plume center
        plume_center_lon: Longitude of plume center
        emission_rate: Estimated emission rate
        
    Returns:
        Dict with attribution results
    """
    rng = random.Random((plume_center_lat, plume_center_lon))
    
    # Simulate finding nearby facility
    distance_km = rng.uniform(0.5, 50)
    confidence = max(0.5, 1.0 - (distance_km / 100))
    
    facility_types = ["oil_well", "gas_plant", "coal_mine", "landfill"]
    
    return {
        "facility_id": f"FAC_{int(plume_center_lat*100)}_{int(plume_center_lon*100)}",
        "facility_name": f"Facility {int(distance_km)}km",
        "facility_type": rng.choice(facility_types),
        "distance_km": distance_km,
        "attribution_confidence": confidence
    }
