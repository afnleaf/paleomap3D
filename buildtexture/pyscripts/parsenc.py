import os
import re
import pandas as pd
import xarray as xr

write_dir = "data_bin"


# run our stuff
def main():
    dir_path = "frontend/netcdf_1"
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
            create_binary_file(file_path, j)
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
def create_binary_file(file_path, map_num):
    binary_data = parse_nc_file(file_path)
    write_binary_file(binary_data, map_num)


# parse the given netcdf file and turn it into binary data
# 32 bits to represent: latitude, longitude and elevation
def parse_nc_file(file_path):
    data = xr.open_dataset(file_path)
    df = data["z"].to_dataframe()
    #print(df)
    binary_data = ""
    for index, row in df.iterrows():
        lat = int(round(index[0], 1))
        lon = int(round(index[1], 1))
        ele = int(round(row['z'], 1))
        la = signed_binary(lat, 8)
        lo = signed_binary(lon, 9)
        el = signed_binary(ele, 15)

        binary_string = la + lo + el
        #print(f"lat:{lat}, lon:{lon}, z:{ele}")
        #print(f"lat:{la}, lon:{lo}, z:{el}, b:{binary_string}")
        binary_data += binary_string
    
    print(f"R:{file_path} successful.")
    return binary_data


    
# write binary data to a file by byte, pass in correct map number
# our binary string is always 32 bits, 4 bytes, 2 words, 1 nibble 
def write_binary_file(binary_data, map_num):
    if not os.path.exists(write_dir):
        os.makedirs(write_dir)
    write_file_path = os.path.join(write_dir, f'Map{map_num}.bin')
    with open(write_file_path, "wb") as file:
        for i in range(0, len(binary_data), 8):
            byte = binary_data[i:i+8]
            if byte:
                byte_val = int(byte, 2)
                if byte_val > 255:
                    byte_val = 255
                file.write(bytes([byte_val]))
    print(f"W:{write_file_path} successful.")


# turn an integer n into n_bit encoded integer
# big endian style (i think)
def signed_binary(n, n_bits):
    if n < 0:
        binary_string = bin(abs(n))[2:]
        binary_string = binary_string.zfill(n_bits)
        inverted_string = ''.join('1' if bit == '0' else '0' for bit in binary_string)
        signed_binary_string = bin(int(inverted_string, 2) + 1)[2:]
        signed_binary_string = signed_binary_string.zfill(n_bits)
        return signed_binary_string
    else:
        # For positive numbers, simply convert to binary and pad with zeros
        binary_string = bin(n)[2:]
        return binary_string.zfill(n_bits)


# default
if __name__ == "__main__":
    main()
