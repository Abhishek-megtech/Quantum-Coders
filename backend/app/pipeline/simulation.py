"""Simulation pipeline - realistic emission data generation."""
import random
import math

def generate_global_emission_heatmap():
    """
    Generate realistic global methane emission hotspots.
    
    Returns:
        List of hotspot dicts with location and emission data
    """
    rng = random.Random(42)
    
    hotspots = []
    
    # High-emission regions (level='high', CRITICAL severity)
    high_emitters = [
        {"name": "Permian Basin", "lat": 32.0, "lon": -103.0},
        {"name": "Turkmenistan", "lat": 40.0, "lon": 58.0},
        {"name": "Haynesville", "lat": 33.0, "lon": -94.0},
        {"name": "Marcellus", "lat": 41.0, "lon": -79.0},
        {"name": "West Siberia", "lat": 62.0, "lon": 73.0},
    ]
    
    # Medium-emission regions (level='medium', HIGH severity)
    medium_emitters = [
        {"name": "Bakken", "lat": 48.5, "lon": -103.0},
        {"name": "Eagle Ford", "lat": 28.5, "lon": -98.0},
        {"name": "North Sea", "lat": 58.0, "lon": 2.0},
        {"name": "Niger Delta", "lat": 5.5, "lon": 6.5},
        {"name": "Kazakhstan", "lat": 46.0, "lon": 65.0},
        {"name": "Argentina", "lat": -38.0, "lon": -68.0},
        {"name": "Mexico", "lat": 27.0, "lon": -102.0},
        {"name": "Middle East", "lat": 28.0, "lon": 47.0},
    ]
    
    # Low-emission regions (level='low', MEDIUM severity)
    low_emitters = [
        {"name": "Australia", "lat": -25.0, "lon": 133.0},
        {"name": "Canada", "lat": 56.0, "lon": -118.0},
        {"name": "China", "lat": 37.0, "lon": 104.0},
        {"name": "India", "lat": 22.0, "lon": 79.0},
        {"name": "Indonesia", "lat": -2.0, "lon": 113.0},
        {"name": "Malaysia", "lat": 4.0, "lon": 102.0},
        {"name": "Thailand", "lat": 15.0, "lon": 101.0},
        {"name": "Vietnam", "lat": 16.0, "lon": 107.0},
        {"name": "Brazil", "lat": -10.0, "lon": -55.0},
        {"name": "Colombia", "lat": 4.0, "lon": -72.0},
    ]
    
    # Process high emitters
    for e in high_emitters:
        for i in range(rng.randint(2, 4)):
            lat = e["lat"] + rng.uniform(-1.5, 1.5)
            lon = e["lon"] + rng.uniform(-1.5, 1.5)
            rate = 1500 + rng.uniform(500, 2500)
            hotspots.append({
                "region": e["name"],
                "lat": lat,
                "lon": lon,
                "emission_rate_kg_hr": rate,
                "level": "high"
            })
    
    # Process medium emitters
    for e in medium_emitters:
        for i in range(rng.randint(1, 3)):
            lat = e["lat"] + rng.uniform(-1.0, 1.0)
            lon = e["lon"] + rng.uniform(-1.0, 1.0)
            rate = 600 + rng.uniform(100, 800)
            hotspots.append({
                "region": e["name"],
                "lat": lat,
                "lon": lon,
                "emission_rate_kg_hr": rate,
                "level": "medium"
            })
    
    # Process low emitters
    for e in low_emitters:
        lat = e["lat"] + rng.uniform(-0.8, 0.8)
        lon = e["lon"] + rng.uniform(-0.8, 0.8)
        rate = 100 + rng.uniform(0, 150)
        hotspots.append({
            "region": e["name"],
            "lat": lat,
            "lon": lon,
            "emission_rate_kg_hr": rate,
            "level": "low"
        })
    
    return hotspots
