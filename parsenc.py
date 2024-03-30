import xarray as xr
import pandas as pd

data = xr.open_dataset("frontend/netcdf_6/Map01_PALEOMAP_6min_Holocene_0Ma.nc")
print(data)

data = xr.open_dataset("frontend/netcdf_1/Map01_PALEOMAP_1deg_Holocene_0Ma.nc")
print(data)
