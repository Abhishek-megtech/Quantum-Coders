"""Geographic utilities - coordinate transformations and spatial operations."""
import math

def latlon_to_webmercator(lat, lon):
    """Convert lat/lon to Web Mercator coordinates."""
    x = lon * 20037508.34 / 180.0
    y = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) * 20037508.34 / math.pi
    return x, y

def webmercator_to_latlon(x, y):
    """Convert Web Mercator to lat/lon."""
    lon = x * 180.0 / 20037508.34
    lat = math.atan(math.exp(y * math.pi / 20037508.34)) * 360.0 / math.pi - 90.0
    return lat, lon

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two points."""
    R = 6371  # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def bbox_to_center(bbox_str):
    """Parse bbox string and return center point."""
    parts = bbox_str.split(',')
    lat1, lon1, lat2, lon2 = map(float, parts)
    center_lat = (lat1 + lat2) / 2
    center_lon = (lon1 + lon2) / 2
    return center_lat, center_lon

def bbox_area(bbox_str):
    """Calculate area of bounding box in km²."""
    parts = bbox_str.split(',')
    lat1, lon1, lat2, lon2 = map(float, parts)
    # Approximate calculation (not perfect for large areas)
    lat_dist = haversine_distance(lat1, lon1, lat2, lon1)
    lon_dist = haversine_distance(lat1, lon1, lat1, lon2)
    return lat_dist * lon_dist
