"""Alerts API - super-emitter event tracking."""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random
from app.pipeline.simulation import generate_global_emission_heatmap

router = APIRouter()


def _generate_alerts(n: int = 35, seed: int = 42) -> list:
    """Generate alerts from heatmap data with consistent severity mapping."""
    rng = random.Random(seed)
    
    # Get heatmap data as source of truth
    hotspots = generate_global_emission_heatmap()
    
    alerts = []
    base_time = datetime.utcnow()
    
    for i, spot in enumerate(hotspots[:n]):
        rate = spot["emission_rate_kg_hr"]
        
        # Strict mapping: only 3 severity levels (matching Stats section)
        # High emitters (level='high') → CRITICAL
        # Medium emitters (level='medium') → HIGH
        # Low emitters (level='low') → MEDIUM
        severity_map = {
            "high": "CRITICAL",
            "medium": "HIGH",
            "low": "MEDIUM"
        }
        severity = severity_map.get(spot["level"], "MEDIUM")
        
        offset_h = rng.uniform(0, 72)
        timestamp = (base_time - timedelta(hours=offset_h)).isoformat() + "Z"

        alerts.append({
            "id": f"ALERT_{i:04d}",
            "facility_id": f"FAC_{i:04d}",
            "facility_name": spot["region"],
            "facility_type": "oil_well",
            "lat": spot["lat"],
            "lon": spot["lon"],
            "emission_rate_kg_hr": round(rate, 1),
            "severity": severity,
            "timestamp": timestamp,
            "country": "Global",
            "operator": spot["region"],
            "acknowledged": rng.random() > 0.7,
            "level": spot["level"]
        })

    return sorted(alerts, key=lambda a: a["timestamp"], reverse=True)


@router.get("/alerts")
async def get_alerts(
    severity: str = Query(None, enum=["CRITICAL", "HIGH", "MEDIUM"]),
    limit: int = Query(20, ge=1, le=100),
    unacknowledged_only: bool = Query(False)
):
    """Get alerts from heatmap data (same source as stats/globe)."""
    # Generate all alerts once
    all_alerts = _generate_alerts(35)
    
    # Filter if needed
    filtered_alerts = all_alerts
    if severity:
        filtered_alerts = [a for a in filtered_alerts if a["severity"] == severity]
    if unacknowledged_only:
        filtered_alerts = [a for a in filtered_alerts if not a["acknowledged"]]
    
    # Calculate summary from all alerts
    summary = {
        "critical": sum(1 for a in all_alerts if a["severity"] == "CRITICAL"),
        "high": sum(1 for a in all_alerts if a["severity"] == "HIGH"),
        "medium": sum(1 for a in all_alerts if a["severity"] == "MEDIUM"),
    }
    
    return {
        "alerts": filtered_alerts[:limit],
        "total": len(filtered_alerts),
        "summary": summary
    }
