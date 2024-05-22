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
// installed libs
#include <png.h>

#define BUFFER_SIZE 4
#define FILE_SIZE 6485401
#define WIDTH 3601 //5123
#define HEIGHT 1801 //2500

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
int16_t* openBinFile(char* pathToFile, size_t fileSize);
Pixel* getPixels(Coords* coordArr, int16_t* elevationArr, size_t fileSize);
void createImage(Pixel* pixelArr, size_t fileSize);
void setPixel(png_bytep row, int x, int r, int g, int b);
void getColor(int16_t elevation, int color[3]);

#endif