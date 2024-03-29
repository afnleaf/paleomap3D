# PaleoMap3D
Three.js webapp that renders the globe with colour coded elevation data.  Go back in time and see what the earth used to look like! 🌎🌍🌏

### problem
In csv files, we have:
- longitude (meridians)
- latitude (parallels)
- elevation

Longitude and Latitude are spherical coordinates, rendering works in cartesian coordinates. 
- [x] 3d
- 2d

3D conversion:
```
x = cos(latitude) * cos(longitude)
y = cos(latitude) * sin(longitude)
z = sin(latitude)
```

2D conversion:
```
? ToDo
```

Color gradient with elevation.
- find max and min for scale.
- min: -11000.0
- max: 10500.0

109 maps with name of era and how long ago in millions of years.

### Credits
CSV Files used fall under the, Creative Commons Attribution 4.0. Credit to:

Scotese, C.R., 2002,  http://www.scotese.com, (PALEOMAP website).

You can download them here -> https://zenodo.org/records/5460860

Read the full report on the data here -> https://www.earthbyte.org/webdav/ftp/Data_Collections/Scotese_Wright_2018_PaleoDEM/Scotese_Wright2018_PALEOMAP_PaleoDEMs.pdf