"""Detection API - AI inference endpoint."""
from fastapi import APIRouter, Query
from app.pipeline.inference import detect_methane
from app.pipeline.simulation import generate_global_emission_heatmap

router = APIRouter()

@router.post("/detect")
async def run_detect(
    bbox: str = Query(..., description="Bounding box as lat1,lon1,lat2,lon2"),
    date: str = Query(None, description="ISO date"),
    simulate: bool = Query(False, description="Skip inference, use simulation"),
    threshold: float = Query(0.45, description="Detection confidence threshold")
):
    """Run full methane detection pipeline."""
    result = await detect_methane(bbox=bbox, date=date, simulate=simulate, threshold=threshold)
    return result


@router.get("/stats")
async def get_stats(date: str = Query(None)):
    """Global methane statistics."""
    hotspots = generate_global_emission_heatmap()
    
    # Aggregate by severity
    critical = sum(1 for h in hotspots if h["level"] == "high")
    high = sum(1 for h in hotspots if h["level"] == "medium")
    medium = sum(1 for h in hotspots if h["level"] == "low")
    
    return {
        "total_facilities": len(hotspots),
        "severity_distribution": {
            "critical": critical,
            "high": high,
            "medium": medium
        },
        "global_emission_rate_kg_hr": sum(h["emission_rate_kg_hr"] for h in hotspots)
    }


@router.get("/heatmap")
async def get_heatmap():
    """Get global emission heatmap data."""
    hotspots = generate_global_emission_heatmap()
    
    return {
        "hotspots": [
            {
                "lat": h["lat"],
                "lon": h["lon"],
                "emission_rate_kg_hr": h["emission_rate_kg_hr"],
                "level": h["level"],
                "region": h["region"]
            }
            for h in hotspots
        ],
        "total_hotspots": len(hotspots),
        "total_emission_kg_hr": sum(h["emission_rate_kg_hr"] for h in hotspots)
    }
