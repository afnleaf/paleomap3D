import xarray as xr
import pandas as pd

#data = xr.open_dataset("frontend/netcdf_6/Map01_PALEOMAP_6min_Holocene_0Ma.nc")
#print(data)

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

data = xr.open_dataset("frontend/netcdf_1/Map01_PALEOMAP_1deg_Holocene_0Ma.nc")

df = data["z"].to_dataframe()
print(df)
binary_data = ""
for index, row in df.iterrows():
    lat = int(round(index[0], 1))
    lon = int(round(index[1], 1))
    ele = int(round(row['z'], 1))
    la = signed_binary(lat, 8)
    lo = signed_binary(lon, 9)
    el = signed_binary(ele, 15)
    
    binary_string = la + lo + el
    print(f"lat:{lat}, lon:{lon}, z:{ele}")
    print(f"lat:{la}, lon:{lo}, z:{el}, b:{binary_string}")
    binary_data += binary_string


# Write binary data to a file
with open('binary_data1.bin', 'wb') as file:
    for i in range(0, len(binary_data), 8):
        byte = binary_data[i:i+8]
        if byte:
            byte_val = int(byte, 2)
            if byte_val > 255:
                byte_val = 255
            file.write(bytes([byte_val]))

'''
def back_to_int(bstr):
    n_bits = len(bstr)
    signed_int = int(bstr, 2)
    if bstr[0] == '1':
        signed_int -= 2**n_bits
    return signed_int
#binary_string = latb + lonb + eleb
biglist.append([la, lo, el])
print(f"lat:{lat}, lon:{lon}, z:{ele}")
print(f"lat:{la}, lon:{lo}, z:{el}")
la = back_to_int(la)
lo = back_to_int(lo)
el = back_to_int(el)
print(f"lat:{la}, lon:{lo}, z:{el}")
latb = format(lat, '08b')
lonb = format(lon, '09b')
eleb = format(ele, '015b')
'''