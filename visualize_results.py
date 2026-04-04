import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize, ListedColormap
import os

# Load the NPY files
outputs_dir = 'outputs'

print("📊 Loading visualization files...")
seg_mask = np.load(os.path.join(outputs_dir, 'plume_segmentation_mask.npy'))
intensity_map = np.load(os.path.join(outputs_dir, 'plume_intensity_map.npy'))
emission_map = np.load(os.path.join(outputs_dir, 'plume_emission_map.npy'))
confidence_map = np.load(os.path.join(outputs_dir, 'plume_confidence_map.npy'))

print(f"✅ Segmentation mask shape: {seg_mask.shape}")
print(f"✅ Intensity map shape: {intensity_map.shape}")
print(f"✅ Emission map shape: {emission_map.shape}")
print(f"✅ Confidence map shape: {confidence_map.shape}")

# Create figure with 4 subplots
fig, axes = plt.subplots(2, 2, figsize=(14, 12))
fig.suptitle('🛰️ Methane Detection Results - Synthetic Data', fontsize=16, fontweight='bold')

# 1. Segmentation Mask
ax = axes[0, 0]
im1 = ax.imshow(seg_mask, cmap='tab20', vmin=0, vmax=20)
ax.set_title('Plume Segmentation Mask\n(Plume IDs)', fontsize=12, fontweight='bold')
ax.set_xlabel('X Pixel')
ax.set_ylabel('Y Pixel')
plt.colorbar(im1, ax=ax, label='Plume ID')

# 2. Intensity Map
ax = axes[0, 1]
im2 = ax.imshow(intensity_map, cmap='hot')
ax.set_title('Plume Intensity Map\n(Spectral Absorption)', fontsize=12, fontweight='bold')
ax.set_xlabel('X Pixel')
ax.set_ylabel('Y Pixel')
plt.colorbar(im2, ax=ax, label='Intensity')

# 3. Emission Map
ax = axes[1, 0]
im3 = ax.imshow(emission_map, cmap='YlOrRd')
ax.set_title('Methane Emission Rate\n(kg/hr)', fontsize=12, fontweight='bold')
ax.set_xlabel('X Pixel')
ax.set_ylabel('Y Pixel')
plt.colorbar(im3, ax=ax, label='Emission (kg/hr)')

# 4. Confidence Map
ax = axes[1, 1]
im4 = ax.imshow(confidence_map, cmap='viridis', vmin=0, vmax=100)
ax.set_title('Detection Confidence\n(Percentage)', fontsize=12, fontweight='bold')
ax.set_xlabel('X Pixel')
ax.set_ylabel('Y Pixel')
plt.colorbar(im4, ax=ax, label='Confidence (%)')

plt.tight_layout()

# Save figure
output_file = 'outputs/visualization_results.png'
plt.savefig(output_file, dpi=150, bbox_inches='tight')
print(f"\n✅ Visualization saved: {output_file}")

# Print statistics
print("\n" + "="*70)
print("📈 STATISTICS")
print("="*70)
print(f"\nSegmentation Mask:")
print(f"  • Min plume ID: {seg_mask.min()}")
print(f"  • Max plume ID: {seg_mask.max()}")
print(f"  • Unique plumes: {len(np.unique(seg_mask)) - 1}")  # -1 for background (0)

print(f"\nIntensity Map:")
print(f"  • Min: {intensity_map.min():.4f}")
print(f"  • Max: {intensity_map.max():.4f}")
print(f"  • Mean: {intensity_map.mean():.4f}")

print(f"\nEmission Map:")
print(f"  • Min: {emission_map.min():.2f} kg/hr")
print(f"  • Max: {emission_map.max():.2f} kg/hr")
print(f"  • Mean: {emission_map.mean():.2f} kg/hr")
print(f"  • Total: {emission_map.sum():.2f} kg/hr")

print(f"\nConfidence Map:")
print(f"  • Min: {confidence_map.min():.2f}%")
print(f"  • Max: {confidence_map.max():.2f}%")
print(f"  • Mean: {confidence_map.mean():.2f}%")

print("\n" + "="*70)
print("✅ Visualization complete! Check: outputs/visualization_results.png")
print("="*70)

# Show plot
plt.show()
