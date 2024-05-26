/**
 *  @project 
 *  @file
 *  @author
 *  @brief
 */

#ifndef COMMON_H
#define COMMON_H
// standard libs
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <endian.h>
#include <dirent.h>
#include <ctype.h>
#include <string.h>
// installed libs
#include <png.h>

#define FILE_SIZE 6485401
#define NUM_FILES 109
#define WIDTH 7200 //3600
#define HEIGHT 3600 //1800

typedef struct {
    float latitude;
    float longitude;
} Coords;

typedef struct {
    int x;
    int y;
    int r;
    int g;
    int b;
} Pixel;

void callError();
char** getFilepaths(const char* directory);
Coords* generateVertices();
int* openBinFile(char* pathToFile, size_t fileSize);
Pixel* getPixels(Coords* coordArr, int* elevationArr, size_t fileSize);
void getColor(int elevation, int color[3]);
void setPixel(png_bytep row, int x, int r, int g, int b);
void createImage(Pixel* pixelArr, size_t fileSize, const char* fileName);
char* getMapNum(const char* filepath);

#endif