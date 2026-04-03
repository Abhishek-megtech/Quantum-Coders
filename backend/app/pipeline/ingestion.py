"""Data ingestion pipeline - satellite imagery preprocessing."""
import numpy as np

def load_satellite_image(date, bbox):
    """
    Simulate loading satellite data from archive.
    
    Args:
        date: ISO date string
        bbox: Bounding box (lat1,lon1,lat2,lon2)
        
    Returns:
        Multi-band satellite image array
    """
    # Simulate: load from cloud storage
    # This would normally fetch from Google Cloud Storage, AWS S3, etc.
    
    # Return realistic multi-band array (H, W, bands)
    # Bands: RGB, SWIR1, SWIR2, TIR
    image = np.random.rand(512, 512, 4).astype(np.float32)
    
    # Add some realistic structure
    y, x = np.ogrid[:512, :512]
    gaussian = np.exp(-((x-256)**2 + (y-256)**2) / 20000)
    image[:, :, 3] += gaussian * 0.3  # TIR band brightest at center
    
    return image


def preprocess_image(image):
    """
    Radiometric and geometric correction of satellite image.
    
    Args:
        image: Raw multi-band satellite image
        
    Returns:
        Preprocessed image ready for inference
    """
    # Radiometric calibration (DN -> reflectance/radiance)
    # Simplified: just normalization
    processed = image.copy()
    for i in range(processed.shape[2]):
        band = processed[:, :, i]
        band_min = np.percentile(band, 2)
        band_max = np.percentile(band, 98)
        processed[:, :, i] = np.clip((band - band_min) / (band_max - band_min), 0, 1)
    
    return processed


def get_cloud_mask(image):
    """
    Generate cloud mask from image.
    
    Returns:
        Binary mask where True = cloudy
    """
    # Simple heuristic: high brightness in blue + low TIR = cloud
    blue = image[:, :, 0]
    tir = image[:, :, 3]
    
    cloud_likelihood = (blue * 0.7 - tir * 0.3)
    mask = cloud_likelihood > 0.5
    
    return mask
