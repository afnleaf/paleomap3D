#include "common.h"

void callError() {
    perror("Error reading file");
}

size_t getBinFileSize(char* filepath) {
    // declare vars
    FILE* fileP = NULL;
    fileP = fopen(filepath, "rb");
    size_t i = 0;
    if(fileP) {
        uint16_t buf;
        // reset to top of file
        fseek(fileP, 0, SEEK_SET);
        // loop through file pointer to get file size
        while(fread(&buf, sizeof(buf), 1, fileP) == 1) {
            i++;
        }
        // check for error
        if(ferror(fileP)) {
            callError();
        } else {
            printf("%d\n", i);
        }
        fclose(fileP);
    } else {
        callError();
    }
    return i;
}

void printBits(uint16_t num) {
    for(int i = 15; i >= 0; i--) {
        printf("%d", (num >> i) & 1);
    }
    printf("\n");
}

Coords* generateVertices() {
    size_t fileSize = 1801 * 3601;
    Coords* coordArr = (Coords*)malloc(sizeof(Coords) * fileSize);
    size_t c = 0;
    for (int i = 900; i >= -900; i -= 1) {
        for (int j = -1800; j <= 1800; j += 1) {
            float latitude = i/10.0;
            float longitude = j/10.0;
            //printf("<%f> <%f>\n", latitude, longitude);
            //coordArr = realloc(coordArr, (c + 1) * sizeof(Coords));
            coordArr[c].latitude = latitude;
            coordArr[c].longitude = longitude;
            c++;
        }
    }
    //printf("%lu\n", c);
    return coordArr;
}

int* openBinFile(char* filepath, size_t fileSize) {
    // declare vars
    FILE* fileP = NULL;
    fileP = fopen(filepath, "rb");
    int* arr = NULL;
    if(fileP) {
        // allocate memory for int16 array
        arr = (int*)malloc(sizeof(int) * fileSize);
        uint16_t buffer;
        // reset to top of file
        fseek(fileP, 0, SEEK_SET);
        // loop through file pointer to get file size
        int i = 0;
        while(fread(&buffer, sizeof(buffer), 1, fileP) == 1) {
            //printf("%d: %d\n", i, buffer);
            // convert big-endian uint16_t to host endianness
            int16_t hostBuffer = be16toh(buffer);
            // sign-extend to int
            arr[i] = (int)hostBuffer;
            //arr[i] = buffer;
            i++;
        }
        //printBits(buffer);
        // check for error
        if(ferror(fileP)) {
            callError();
        }
        fclose(fileP);
    } else {
        callError();
    }
    return arr;
}

 Pixel* getPixels(Coords* coordArr, int* elevationArr, size_t fileSize) {
    // allocate memory
    Pixel* pixelArr = (Pixel*)malloc(sizeof(Pixel) * fileSize);
    for(size_t i = 0; i < fileSize; i++) {
        float lat = coordArr[i].latitude;
        float lon = coordArr[i].longitude;
        int ele = elevationArr[i];
        //printf("<%.2f> <%.2f> <%d>\n", lat, lon, ele);
        int x = (int)roundf(((lon + 180) / 360 * WIDTH));
        int y = (int)roundf(((90 - lat) / 180 * HEIGHT));
        //printf("x<%d> y<%d>\n", x, y);
        int color[3];
        getColor(ele, color);
        int r = color[0];
        int g = color[1];
        int b = color[2];    
        pixelArr[i].x = x;
        pixelArr[i].y = y;
        pixelArr[i].r = r;
        pixelArr[i].g = g;
        pixelArr[i].b = b;
    }
    return pixelArr;
}

void getColor(int elevation, int color[3]) {
    int sea_level = 0;
    if(elevation <= -13000) {
        color[0] = 0;  // 0x000000
        color[1] = 255;
        color[2] = 0;
        printf("<%d>\n", elevation);
    } else if(elevation > -13000 && elevation < -6000) {
        color[0] = 8;  // 0x080e30
        color[1] = 14;
        color[2] = 48;
    } else if(elevation >= -6000 && elevation < -3000) {
        color[0] = 31;  // 0x1f2d47
        color[1] = 45;
        color[2] = 71;
    } else if(elevation >= -3000 && elevation < -150) {
        color[0] = 42;  // 0x2a3c63
        color[1] = 60;
        color[2] = 99;
    } else if(elevation >= -150 && elevation <= sea_level) {
        color[0] = 52;  // 0x344b75
        color[1] = 75;
        color[2] = 117;
    } else if(elevation > sea_level && elevation < 100) {
        color[0] = 52;  // 0x347a2a
        color[1] = 122;
        color[2] = 42;
    } else if(elevation >= 100 && elevation < 400) {
        color[0] = 0;  // 0x00530b
        color[1] = 53;
        color[2] = 11;
    } else if(elevation >= 400 && elevation < 1000) {
        color[0] = 61;  // 0x3d3704
        color[1] = 55;
        color[2] = 4;
    } else if(elevation >= 1000 && elevation < 2000) {
        color[0] = 128;  // 0x805411
        color[1] = 84;
        color[2] = 68;
    } else if(elevation >= 2000 && elevation < 3200) {
        color[0] = 151;  // 0x977944
        color[1] = 122;
        color[2] = 68;
    } else if(elevation >= 3200) {
        color[0] = 173;  // 0xadacac
        color[1] = 172;
        color[2] = 172;
    } else {
        color[0] = 0;  // 0x000000
        color[1] = 0;
        color[2] = 0;
        printf("<%d>\n", elevation);
    }
}

void setPixel(png_bytep row, int x, int r, int g, int b) {
    png_bytep px = &(row[x * 3]);
    px[0] = r;
    px[1] = g;
    px[2] = b;
}

void createImage(Pixel* pixelArr, size_t fileSize, const char* fileName) {
    // open file in binary mode write
    //FILE *fp = fopen("./output/texture0.png", "wb");
    FILE *fp = fopen(fileName, "wb");
    if(!fp) {
        perror("Failed to open file for writing.\n");
        return;
    }
    // libpng setup
    png_structp png = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if(!png) {
        fclose(fp);
        perror("Failed to create PNG write structure.\n");
        return;
    }
    // info struct
    png_infop info = png_create_info_struct(png);
    if(!info) {
        png_destroy_write_struct(&png, NULL);
        fclose(fp);
        perror("Failed to create PNG info structure.\n");
        return;
    }
    // error handling
    if(setjmp(png_jmpbuf(png))) {
        png_destroy_write_struct(&png, &info);
        fclose(fp);
        perror("Error during png creation.\n");
        return;
    }
    // init PNG IO
    png_init_io(png, fp);
    // image attributes
    png_set_IHDR(
        png,
        info,
        WIDTH, HEIGHT,
        8, // 8-bit depth
        PNG_COLOR_TYPE_RGB,
        PNG_INTERLACE_NONE,
        PNG_COMPRESSION_TYPE_DEFAULT,
        PNG_FILTER_TYPE_DEFAULT
    );
    // header of image
    png_write_info(png, info);
    // allocate memory for rows of image
    png_bytep *rowP = (png_bytep*) malloc(sizeof(png_bytep) * HEIGHT);
    for(int y = 0; y < HEIGHT; y++) {
        rowP[y] = (png_bytep) malloc(3 * WIDTH * sizeof(png_byte));
        for(int x = 0; x < WIDTH; x++) {
            // init green
            setPixel(rowP[y], x, 0, 255, 0);
        }
    }
    // go through passed in pixels and turn into image pixel
    for(size_t i = 0; i < fileSize; i++) {
        int x = pixelArr[i].x;
        int y = pixelArr[i].y;
        int r = pixelArr[i].r;
        int g = pixelArr[i].g;
        int b = pixelArr[i].b;
        if(x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
            //printf("x:<%d> y:<%d>\n", x, y);
            setPixel(rowP[y], x, r, g, b);
        }
    }
    // PNG file writing
    png_write_image(png, rowP);
    png_write_end(png, NULL);
    // clean up memory
    fclose(fp);
    for(int y = 0; y < HEIGHT; y++) {
        free(rowP[y]);
    }
    free(rowP);
    png_destroy_write_struct(&png, &info);
}

char** getFilepaths(const char* directory) {
    // dirent.h
    DIR* dir;
    struct dirent* entry;
    dir = opendir(directory);

    // allocate memory
    char path[256];
    char** filepathArr = (char**)malloc(sizeof(char*) * NUM_FILES);
    int i = 0;
    if(dir != NULL) {
        while((entry = readdir(dir)) != NULL) {
            if(entry->d_type == DT_REG) {
                strcpy(path, directory);
                strcat(path, "/");
                strcat(path, entry->d_name);
                //strcat(path, "\0");
                //printf("<%s>\n", path);
                filepathArr[i] = (char*)malloc(sizeof(char) * strlen(path) + 1);
                strcpy(filepathArr[i], path);
                i++;
            }
        }
        closedir(dir);
    }
    return filepathArr;
}

char* getMapNum(const char* filepath) {
    char* temp = (char*)malloc(sizeof(char) * 16);
    int i = 0;
    while(*filepath != '\0') {
        if(isdigit(*filepath)) {
            //printf("<%c>\n", *filepath);
            temp[i++] = *filepath;
        }
        //printf("i<%d>\n", i);
        filepath++;
    }
    temp[i] = '\0';
    //char* result = strdup(temp);
    //free(temp);
    return temp;
}

int main() {
    size_t fileSize = FILE_SIZE;
    // get all filepaths
    char** filepathArr = getFilepaths("./data_bin/large");
    printf("File paths found.\n");
    // generate all possible coordinates
    Coords* coordArr = generateVertices();
    /*
    for(size_t i = 0; i < fileSize; i++) {
        printf("<%.1f> <%.1f>\n", coordArr[i].latitude, coordArr[i].longitude);
    }
    */

    // loop through all filepaths
    for(int i = 0; i < NUM_FILES; i++) {
        char* filepath = filepathArr[i];
        // get map number for output file
        char* mapNum = getMapNum(filepath);
        printf("<%s>\n", mapNum);
        //const fileName = `./output/texture${mapNum}.png`;
        char fileName[256];
        snprintf(fileName, sizeof(fileName), "./output/texture%d.png", atoi(mapNum));
        //size_t fileSize = getBinFileSize(filepath);
        int* elevationArr = openBinFile(filepath, fileSize);
        if(elevationArr != NULL) {
            printf("File read success.\n");
        } else {
            printf("File read failure.\n");
        }
        /*
        for(size_t i = 0; i < fileSize; i++) {
            printf("%d: %d\n", i, elevationArr[i]);
        }
        */
        Pixel* pixelArr = getPixels(coordArr, elevationArr, fileSize);
        printf("Pixels done.\n");
        createImage(pixelArr, fileSize, fileName);
        printf("Image done.\n");
        // free memory
        free(mapNum);
        free(elevationArr);
        free(pixelArr);
    }

    // free memory
    for(int i = 0; i < NUM_FILES; i++) {
        free(filepathArr[i]);
    }
    free(filepathArr);
    free(coordArr);
    return 0;
}


