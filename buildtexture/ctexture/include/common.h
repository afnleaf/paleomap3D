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

#define BUFFER_SIZE 4
#define FILE_SIZE 6485401

typedef struct {
    float latitude;
    float longitude;
} Coords;

void callError();
void printBits(uint16_t num);
Coords* generateVertices();
size_t getBinFileSize(char* pathToFile);
int16_t* openBinFile(char* pathToFile, size_t fileSize);

#endif