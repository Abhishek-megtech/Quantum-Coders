"""Time series data API."""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import math
import random

router = APIRouter()

@router.get("/timeseries")
async def get_timeseries(
    facility_id: str = Query(...),
    days: int = Query(30, ge=1, le=365)
):
    """Get emission time series for facility."""
    rng = random.Random(facility_id)
    data_points = []
    base_rate = 400 + rng.uniform(100, 800)
    total_emission = 0
    max_emission = 0
    min_emission = float('inf')
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i-1)
        # Realistic variation
        noise = math.sin(i * 0.1 + rng.random()) * 150
        rate = base_rate + noise
        rate = max(10, rate)  # Never go below 10
        
        total_emission += rate * 24  # kg per day
        max_emission = max(max_emission, rate)
        min_emission = min(min_emission, rate)
        
        data_points.append({
            "date": date.isoformat(),
            "emission_rate_kg_hr": round(rate, 1)
        })
    
    return {
        "facility_id": facility_id,
        "series": data_points,
        "unit": "kg/hr",
        "average_emission_kg_hr": round(base_rate, 1),
        "peak_emission_kg_hr": round(max_emission, 1),
        "total_emission_kg": round(total_emission, 0)
    }


@router.get("/timeseries/global")
async def get_global_timeseries(days: int = Query(30, ge=1, le=365)):
    """Get global alert count time series."""
    from app.pipeline.simulation import generate_global_emission_heatmap
    
    hotspots = generate_global_emission_heatmap()
    total_emission = sum(h["emission_rate_kg_hr"] for h in hotspots)
    
    data_points = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i-1)
        # Realistic daily variation
        noise = math.sin(i * 0.05) * total_emission * 0.1
        daily_emission = total_emission + noise
        
        data_points.append({
            "date": date.isoformat(),
            "critical_alerts": max(2, int(len(hotspots) * 0.1 + math.sin(i * 0.1) * 5)),
            "high_alerts": max(2, int(len(hotspots) * 0.25 + math.sin(i * 0.08) * 8)),
            "medium_alerts": max(2, int(len(hotspots) * 0.35 + math.sin(i * 0.06) * 10)),
            "global_emission_kg_hr": round(daily_emission, 1)
        })
    
    return {
        "data": data_points,
        "unit": "count",
        "total_alerts": sum(p["critical_alerts"] + p["high_alerts"] + p["medium_alerts"] for p in data_points)
    }


@router.get("/timeseries/emission")
async def get_emission_timeseries(
    facility_id: str = Query(...),
    days: int = Query(30, ge=1, le=365)
):
    """Get emission time series for facility."""
    data_points = []
    base_rate = 500 + math.sin(hash(facility_id) % 1000 / 1000 * math.pi) * 200
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i-1)
        # Realistic variation
        noise = math.sin(i * 0.1) * 100
        rate = base_rate + noise
        data_points.append({
            "date": date.isoformat(),
            "emission_rate_kg_hr": max(0, rate)
        })
    
    return {
        "facility_id": facility_id,
        "data": data_points,
        "unit": "kg/hr"
    }


@router.get("/timeseries/alerts")
async def get_alert_timeseries(
    days: int = Query(30, ge=1, le=365)
):
    """Get alert count time series."""
    data_points = []
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i-1)
        count = max(2, int(20 + math.sin(i * 0.05) * 15))
        data_points.append({
            "date": date.isoformat(),
            "critical_alerts": count // 3,
            "high_alerts": count // 2,
            "medium_alerts": count // 4
        })
    
    return {
        "data": data_points,
        "unit": "count"
    }
