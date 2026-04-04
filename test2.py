import numpy as np
import matplotlib.pyplot as plt

data = np.load('outputs/plume_segmentation_mask.npy')

print(f"Shape: {data.shape}")
print(f"Data type: {data.dtype}")
print(f"Min: {data.min()}, Max: {data.max()}")

plt.imshow(data, cmap='viridis')
plt.colorbar()
plt.title('Plume Segmentation Mask')
plt.savefig('outputs/segmentation_visualization.png')
# Remove: plt.show()
print("✅ Saved: outputs/segmentation_visualization.png")