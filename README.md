# PaleoMap3D

ancient maps, tectonic plates, webapp with a globe


### problem
we have 
longitude - meridians
latitude - parallels
elevation
in csv files

plot lon and lat
- 3d
- 2d

lon and lat are spherical coordinates, 3d rendering works in x, y, z cartesian coordinates

conversion:
```
x = cos(latitude) * cos(longitude)
y = cos(latitude) * sin(longitude)
z = sin(latitude)
```

color gradient with elevation
- find max and min for scale

long with python
min: -11000.0
max: 10500.0

109 maps with name and how long ago
- how to find this information?



### Credits

Creative commons
data maps 109, lon, lat, ele