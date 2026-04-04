import numpy as np
from PIL import Image

img = Image.open('/Users/jagadeesh/Desktop/MIT-METHANE/data/methane_image.png')
data = np.array(img)
np.save('converted1_image.npy', data)