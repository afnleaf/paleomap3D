import os
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

csv_dir_path = "csv_files/"
files = os.listdir(csv_dir_path)

minimum = -11000.0
maximum = 10500.0

for i, file in enumerate(files):
    file_path = csv_dir_path + file
    print(file_path)
    # Load latitude, longitude, and elevation data from a CSV file
    data = np.loadtxt(file_path, delimiter=',', skiprows=1)
    # Slice out longitude, latitude and elevation data
    longitude = data[:, 0]
    latitude = data[:, 1]
    elevation = data[:, 2]
    for elev in elevation:
        #print(elev)
        if elev > maximum:
            maximum = elev
        if elev < minimum:
            minimum = elev

print(f"min: {minimum}")
print(f"max: {maximum}")

