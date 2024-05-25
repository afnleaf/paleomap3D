import os
import re
import math
import pandas as pd
import xarray as xr
from PIL import Image, ImageDraw
from multiprocessing import Pool

write_dir = "textures_small"
dir_path = "../../data_raw/netcdf_1"
#write_dir = "textures_large"
#dir_path = "../data_raw/netcdf_6"

# run our stuff
def main():
    # get sorted files
    files = os.listdir(dir_path)
    netcdf_files = [file for file in files if file.endswith(".nc")]
    netcdf_files = sorted(netcdf_files, key=sort_ascending)
    # process each file
    j = 1
    for i, file in enumerate(netcdf_files):
        if file.endswith(".nc"):
            print(j)
            file_path = dir_path + "/" + file
            create_image(file_path, j)
            j += 1


# to sort the Map__ number in ascending order with the .5s
def sort_ascending(file_name):
    match = re.search(r'\d+(\.\d+)?', file_name)
    if match:
        num = match.group(0)
        return float(num)
    else:
        return


# parse then write the binary file based on the file_path
def create_image(file_path, map_num):
    data = xr.open_dataset(file_path)
    df = data["z"].to_dataframe()
    #print(df)
    # create new image
    width, height = 3601, 1801
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    # loop through dataframe
    for index, row in df.iterrows():
        # get data from frame
        latitude = round(index[0], 2)
        longitude = round(index[1], 2)
        elevation = round(row['z'], 1)
        #print(f"lat:{lat}, lon:{lon}, z:{ele}")
        # convert to image coords
        x = (longitude + 180) / 360 * width
        y = (90 - latitude) / 180 * height
        # get color for the elevation
        color = get_color(elevation)
        r, g, b = color
        draw.rectangle((x, y, x+11, y+11), fill=(int(r), int(g), int(b)))
    # save image
    img.save(f"{write_dir}/texture{map_num}.png")
    print(f"R:{file_path} successful.")


# our colour "gradient", could be fixed
def get_color(elevation):
    sea_level = 0
    color = ()
    if elevation >= -13000 and elevation < -6000:
        color = (8, 14, 48)     # 0x080e30
    elif elevation >= -6000 and elevation < -3000:
        color = (31, 45, 71)    # 0x1f2d47
    elif elevation >= -3000 and elevation < -150:
        color = (42, 60, 99)    # 0x2a3c63
    elif elevation >= -150 and elevation < -50:
        color = (52, 75, 117)   # 0x344b75
    elif elevation >= -50 and elevation <= sea_level:
        color = (87, 120, 179)   # 0x5778b3
    elif elevation > sea_level and elevation < 75:
        color = (79, 166, 66)   # 0x4fa642
    elif elevation >= 75 and elevation < 150:
        color = (52, 122, 42)   # 0x347a2a
    elif elevation >= 150 and elevation < 400:
        color = (0, 83, 11)     # 0x00530b
    elif elevation >= 400 and elevation < 1000:
        color = (61, 55, 4)     # 0x3d3704
    elif elevation >= 1000 and elevation < 2000:
        color = (128, 84, 17)   # 0x805411
    elif elevation >= 2000 and elevation < 3200:
        color = (151, 122, 68)  # 0x977944
    elif elevation >= 3200 and elevation < 5000:
        color = (182, 181, 181) # 0xb6b5b5
    else:
        color = (238, 238, 238) # 0xeeeee
        
    return color



# default
if __name__ == "__main__":
    main()
