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
#define WIDTH 3600 //5123
#define HEIGHT 1800 //2500

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
void printBits(uint16_t num);
Coords* generateVertices();
size_t getBinFileSize(char* pathToFile);
int* openBinFile(char* pathToFile, size_t fileSize);
Pixel* getPixels(Coords* coordArr, int* elevationArr, size_t fileSize);
void createImage(Pixel* pixelArr, size_t fileSize, const char* fileName);
void setPixel(png_bytep row, int x, int r, int g, int b);
void getColor(int elevation, int color[3]);
char* getMapNum(const char* filepath);

#endif