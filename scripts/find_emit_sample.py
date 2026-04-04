from __future__ import annotations

import json
import sys

from ai.data.emit_fetcher import emit_availability


CANDIDATES = [
    ("Atacama Desert, Chile", -24.5, -69.0),
    ("Sahara, Algeria", 26.0, 0.0),
    ("Sahara, Libya", 25.0, 17.0),
    ("Namib Desert, Namibia", -23.0, 15.0),
    ("Rub al Khali, Saudi Arabia", 21.0, 50.0),
    ("Gobi Desert, Mongolia", 43.0, 104.0),
    ("Central Australia", -25.0, 134.0),
    ("Great Basin, USA", 39.0, -116.0),
    ("Mojave Desert, USA", 35.0, -116.0),
    ("Sonoran Desert, USA", 32.0, -113.0),
]


def main() -> int:
    days = 90
    radius_km = 20.0
    for name, lat, lon in CANDIDATES:
        try:
            res = emit_availability(lat, lon, days=days, radius_km=radius_km)
        except Exception as exc:
            res = {"available": False, "error": str(exc)}
        res.update({"name": name, "lat": lat, "lon": lon, "days": days, "radius_km": radius_km})
        print(json.dumps(res, indent=2))
        if res.get("available"):
            print("FOUND_EMIT_SAMPLE")
            return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
