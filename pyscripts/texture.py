import os
import re
import math
import pandas as pd
import xarray as xr
from PIL import Image, ImageDraw

#write_dir = "textures_small"
#dir_path = "../data_raw/netcdf_1"
write_dir = "textures_large"
dir_path = "../data_raw/netcdf_6"

# run our stuff
def main():
    files = os.listdir(dir_path)
    netcdf_files = []
    for file in files:
        if file.endswith(".nc"):
            netcdf_files.append(file)  

    netcdf_files = sorted(netcdf_files, key=sort_ascending)
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
    width, height = 5123, 2500
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
        draw.rectangle((x, y, x+11, y+11), fill=(int(r*255), int(g*255), int(b*255)))
    # save image
    img.save(f"{write_dir}/texture{map_num}.png")
    print(f"R:{file_path} successful.")


# our colour "gradient", could be fixed
def get_color(elevation):
    sea_level = 0
    color = ()
    if elevation >= -12000 and elevation < -6000:
        color = (8/255, 14/255, 48/255)  # 0x080e30
    elif elevation >= -6000 and elevation < -3000:
        color = (31/255, 45/255, 71/255)  # 0x1f2d47
    elif elevation >= -3000 and elevation < -150:
        color = (42/255, 60/255, 99/255)  # 0x2a3c63
    elif elevation >= -150 and elevation <= sea_level:
        color = (52/255, 75/255, 117/255)  # 0x344b75
    elif elevation > sea_level and elevation < 100:
        color = (52/255, 122/255, 42/255)  # 0x347a2a
    elif elevation >= 100 and elevation < 400:
        color = (0/255, 53/255, 11/255)  # 0x00530b
    elif elevation >= 400 and elevation < 1000:
        color = (61/255, 55/255, 4/255)  # 0x3d3704
    elif elevation >= 1000 and elevation < 2000:
        color = (128/255, 84/255, 68/255)  # 0x805411
    elif elevation >= 2000 and elevation < 3200:
        color = (151/255, 122/255, 68/255)  # 0x977944
    else:
        color = (173/255, 172/255, 172/255)  # 0xadacac
    return color

# default
if __name__ == "__main__":
    main()
