from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request


def _get_json(url: str, timeout: int = 20) -> dict:
    req = urllib.request.Request(url, method="GET")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _post_json(url: str, payload: dict, timeout: int = 30) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Test /geocode and /predict/live endpoints")
    parser.add_argument("--base", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--address", default="Goa India", help="Address to geocode")
    parser.add_argument("--lat", type=float, default=15.368606, help="Latitude")
    parser.add_argument("--lon", type=float, default=73.944799, help="Longitude")
    args = parser.parse_args()

    base = args.base.rstrip("/")

    try:
        geocode_url = f"{base}/geocode?" + urllib.parse.urlencode({"address": args.address})
        geocode_res = _get_json(geocode_url)
        print("/geocode status: ok" if geocode_res.get("ok") else "/geocode status: no result")
        print(json.dumps(geocode_res, indent=2))
    except Exception as exc:
        print(f"/geocode failed: {exc}")

    try:
        live_url = f"{base}/predict/live"
        live_res = _post_json(live_url, {"lat": args.lat, "lon": args.lon})
        print("\n/predict/live result:")
        print(json.dumps(live_res, indent=2))
    except Exception as exc:
        print(f"/predict/live failed: {exc}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
