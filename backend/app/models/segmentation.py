"""Segmentation model - methane plume boundary detection."""
import numpy as np
from scipy.ndimage import label, find_objects

def segment_methane_plume(image, threshold=0.45):
    """
    Segment methane plume from satellite imagery.
    
    Args:
        image: Multi-band satellite image (H, W, C)
        threshold: Detection confidence threshold
        
    Returns:
        binary mask of detected plume
    """
    # Compute methane index from SWIR bands
    if image.shape[2] < 3:
        return np.zeros((image.shape[0], image.shape[1]), dtype=bool)
    
    # Simplified: use band ratios
    band1 = image[:, :, 1].astype(float) + 1e-8
    band2 = image[:, :, 2].astype(float) + 1e-8
    methane_index = band2 / band1
    
    # Normalize
    methane_index = (methane_index - methane_index.min()) / (methane_index.max() - methane_index.min() + 1e-8)
    
    # Threshold
    mask = methane_index > threshold
    
    return mask
