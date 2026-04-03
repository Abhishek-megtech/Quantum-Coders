"""Wind utilities - meteorological data processing."""
import math

def get_wind_vector(speed_ms, direction_deg):
    """Convert wind speed + direction to u,v components."""
    direction_rad = math.radians(direction_deg)
    u = speed_ms * math.sin(direction_rad)
    v = speed_ms * math.cos(direction_rad)
    return u, v

def uv_to_wind(u, v):
    """Convert u,v components back to speed + direction."""
    speed = math.sqrt(u**2 + v**2)
    direction = math.degrees(math.atan2(u, v))
    if direction < 0:
        direction += 360
    return speed, direction

def estimate_plume_extent(emission_rate, wind_speed, atmospheric_stability="neutral"):
    """
    Estimate methane plume extent based on emission and wind.
    
    Returns:
        Dict with plume dimensions
    """
    # Gaussian plume model approximation
    stability_factor = {
        "stable": 0.5,
        "neutral": 1.0,
        "unstable": 1.5
    }.get(atmospheric_stability, 1.0)
    
    # Plume length grows with distance in wind direction
    plume_length = (emission_rate / 100) * (5 / (wind_speed + 0.1)) * stability_factor
    plume_width = (emission_rate / 500) * stability_factor
    plume_depth = (emission_rate / 1000) * stability_factor
    
    return {
        "length_km": max(1, min(50, plume_length)),
        "width_km": max(0.5, min(20, plume_width)),
        "max_depth_m": max(100, min(1000, plume_depth * 200))
    }

def wind_dispersion_time(distance_km, wind_speed_ms):
    """How long before plume reaches a given distance."""
    if wind_speed_ms < 0.1:
        return float('inf')
    hours = (distance_km * 1000) / (wind_speed_ms * 3600)
    return hours
