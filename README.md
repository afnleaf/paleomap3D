# PaleoMap3D
Three.js webapp that renders the globe with colour coded elevation data.  Go back in time and see what the earth used to look like! 🌎🌍🌏

## problem
In csv files, we have:
- longitude (meridians)
- latitude (parallels)
- elevation

Longitude and Latitude are spherical coordinates, rendering works in cartesian coordinatesm.

3D conversion:
```
R = radius
x = R * cos(latitude) * cos(longitude)
y = R * cos(latitude) * sin(longitude)
z = R * sin(latitude)
```

Color gradient with elevation.
- find max and min for scale.
- min: -11000.0
- max: 10500.0

109 maps with name of era and how long ago in millions of years.

- Some maps are missing a thousand or so points
- CSV files are large ~1mb
- netcdf format exist, how do we parse it?
- binary files > csv files?

----

## Credits
CSV files used fall under the, Creative Commons Attribution 4.0 license. Credit to:

"Plate tectonic maps and Continental drift animations by C. R. Scotese,
PALEOMAP Project (www.scotese.com)"

"PaleoDEMS_long_lat_elev_csv_v2.zip" by C. R. Scotese, PALEOMAP Project (http://www.scotese.com/), retrieved from https://zenodo.org/records/5460860, used under Creative Commons Attribution 4.0 International License (http://creativecommons.org/licenses/by/4.0/)

You can download them [here](https://zenodo.org/records/5460860)

Read the full report on the data [here](https://www.earthbyte.org/webdav/ftp/Data_Collections/Scotese_Wright_2018_PaleoDEM/Scotese_Wright2018_PALEOMAP_PaleoDEMs.pdf)

Skybox (Spacebox) generated [here](https://tools.wwwtyro.net/space-3d/index.html#animationSpeed=0.40999401408739444&fov=75.43504464834814&nebulae=false&pointStars=true&resolution=1024&seed=aqywua8jycc&stars=true&sun=true)



### Custom files
```
we need to know the coordinates position because are missing?

netcdf_1

Dimensions:  (lon: 361, lat: 181) = 65,341 points

Coordinates:
    - * lon      (lon) float64 3kB -180.0 -179.0 -178.0 -177.0 ... 178.0 179.0 180.0
    - * lat      (lat) float64 1kB -90.0 -89.0 -88.0 -87.0 ... 87.0 88.0 89.0 90.0

why does this need to be float64 in the file? We can represent

-180 to 180 as 9 bit signed integer, 512 range
-90 to 90 as 8 bit signed integer, 256 range

elevation

Data variables:
    - z        (lat, lon) float32 261kB ...

Why does this need to be float32? we go from min -11000.0m to max 10500.0m

21500 range, 15 bit should be enough 2^15 = 32,768

add it all together

9 + 8 + 15 = 32 for one coordinate + elevation 4 bytes
4 * 65,341 = 261,364 bytes = 261.364 kB

same as the (uncompressed .nc) files

.nc files just have the overhead of requiring to be parsed and decompressed or w/e
```

