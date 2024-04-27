import os
import re
import math
import pandas as pd
import xarray as xr

write_dir = "textures"
dir_path = "data_raw/netcdf_1"
R = 6371

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
    image_data = parse_nc_file(file_path)
    write_image(binary_data, map_num)


# parse the given netcdf file and turn it into binary data
# 32 bits to represent: latitude, longitude and elevation
def parse_nc_file(file_path):
    data = xr.open_dataset(file_path)
    df = data["z"].to_dataframe()
    #print(df)
    binary_data = ""
    for index, row in df.iterrows():
        # get data from frame
        lat = round(index[0], 1)
        lon = round(index[1], 1)
        ele = round(row['z'], 1)
        print(f"lat:{lat}, lon:{lon}, z:{ele}")
        rlo = lon * Math.PI
        #const rlo = longitude * (Math.PI / 180);
        #const rla = latitude * (Math.PI / 180);

        # convert to x, y coords
        x = R * lon * cos(0)
        
    
    print(f"R:{file_path} successful.")
    return binary_data


def write_image(image_data, map_num):
    if not os.path.exists(write_dir):
        os.makedirs(write_dir)
    write_file_path = os.path.join(write_dir, f'Map{map_num}.bin')

    '''
    with open(write_file_path, "wb") as file:
        for i in range(0, len(binary_data), 8):
            byte = binary_data[i:i+8]
            if byte:
                byte_val = int(byte, 2)
                if byte_val > 255:
                    byte_val = 255
                file.write(bytes([byte_val]))
    '''

    print(f"W:{write_file_path} successful.")


# default
if __name__ == "__main__":
    main()
