"""Facilities API - infrastructure data."""
from fastapi import APIRouter, Query
import json
import os
import random

router = APIRouter()

def load_facilities():
    """Load facilities from GeoJSON."""
    geojson_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'facilities.geojson')
    if os.path.exists(geojson_path):
        with open(geojson_path) as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": []}

def convert_feature_to_facility(feature):
    """Convert GeoJSON feature to facility object."""
    props = feature.get("properties", {})
    coords = feature.get("geometry", {}).get("coordinates", [0, 0])
    rng = random.Random(feature.get("id", ""))
    
    return {
        "id": feature.get("id", ""),
        "name": props.get("name", ""),
        "type": props.get("type", "oil_well"),
        "country": props.get("country", ""),
        "operator": props.get("operator", props.get("name", "")),
        "lat": coords[1],
        "lon": coords[0],
        "historical_emission_rate": rng.uniform(100, 1200),
        "risk_score": rng.uniform(0.3, 0.95),
        "last_detected": "2024-01-15T10:30:00Z",
        "detection_count": rng.randint(1, 50)
    }

@router.get("/facilities")
async def get_facilities(
    bbox: str = Query(None, description="Filter by bbox"),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: str = Query("risk_score")
):
    """Get facilities in region."""
    from app.pipeline.simulation import generate_global_emission_heatmap
    
    # Generate hotspots and convert to facilities format
    hotspots = generate_global_emission_heatmap()
    
    facilities = []
    for spot in hotspots:
        facilities.append({
            "id": f"FAC_{spot['region'].replace(' ', '_')}_{len(facilities)}",
            "name": spot["region"],
            "type": "oil_well",
            "country": "Global",
            "operator": spot["region"],
            "lat": spot["lat"],
            "lon": spot["lon"],
            "historical_emission_rate": round(spot["emission_rate_kg_hr"], 1),
            "risk_score": spot["emission_rate_kg_hr"] / 2000,  # Normalize to 0-1
            "last_detected": "2024-01-15T10:30:00Z",
            "detection_count": 15
        })
    
    # Sort
    if sort_by == "risk_score":
        facilities.sort(key=lambda f: f["risk_score"], reverse=True)
    elif sort_by == "historical_emission_rate":
        facilities.sort(key=lambda f: f["historical_emission_rate"], reverse=True)
    
    return {"facilities": facilities[:limit]}


@router.get("/facilities/ranking/top")
async def get_top_polluters(n: int = Query(10, ge=1, le=50)):
    """Get top polluting facilities."""
    from app.pipeline.simulation import generate_global_emission_heatmap
    
    hotspots = generate_global_emission_heatmap()
    hotspots.sort(key=lambda h: h["emission_rate_kg_hr"], reverse=True)
    
    top_polluters = []
    for i, spot in enumerate(hotspots[:n]):
        top_polluters.append({
            "id": f"FAC_{spot['region'].replace(' ', '_')}_{i}",
            "name": spot["region"],
            "type": "oil_well",
            "country": "Global",
            "operator": spot["region"],
            "lat": spot["lat"],
            "lon": spot["lon"],
            "historical_emission_rate": round(spot["emission_rate_kg_hr"], 1),
            "risk_score": min(1.0, spot["emission_rate_kg_hr"] / 1500),
            "detection_count": 20,
            "rank": i + 1
        })
    
    return {"top_polluters": top_polluters}


@router.get("/facilities/{facility_id}")
async def get_facility(facility_id: str):
    """Get specific facility."""
    from app.pipeline.simulation import generate_global_emission_heatmap
    
    hotspots = generate_global_emission_heatmap()
    for spot in hotspots:
        if spot["region"].replace(" ", "_") in facility_id:
            return {
                "id": facility_id,
                "name": spot["region"],
                "type": "oil_well",
                "country": "Global",
                "operator": spot["region"],
                "lat": spot["lat"],
                "lon": spot["lon"],
                "historical_emission_rate": round(spot["emission_rate_kg_hr"], 1),
                "risk_score": min(1.0, spot["emission_rate_kg_hr"] / 1500),
                "detection_count": 20
            }
    return {"error": "Not found"}
