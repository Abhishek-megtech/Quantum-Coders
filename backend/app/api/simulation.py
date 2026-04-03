"""Simulation API - realistic test scenarios."""
from fastapi import APIRouter, Query
from app.pipeline.simulation import generate_global_emission_heatmap

router = APIRouter()

@router.get("/simulation/hotspots")
async def get_hotspots(
    level: str = Query(None, enum=["high", "medium", "low"]),
    limit: int = Query(50, ge=1, le=500)
):
    """Get emission hotspots for map visualization."""
    hotspots = generate_global_emission_heatmap()
    
    if level:
        hotspots = [h for h in hotspots if h["level"] == level]
    
    return {
        "hotspots": hotspots[:limit],
        "count": len(hotspots[:limit]),
        "total": len(hotspots)
    }


@router.get("/simulation/global")
async def get_global_snapshot():
    """Get global methane situation snapshot."""
    hotspots = generate_global_emission_heatmap()
    
    return {
        "timestamp": "2024-01-15T00:00:00Z",
        "total_hotspots": len(hotspots),
        "total_emission_kg_hr": sum(h["emission_rate_kg_hr"] for h in hotspots),
        "critical_count": sum(1 for h in hotspots if h["level"] == "high"),
        "regions": list(set(h["region"] for h in hotspots))
    }
