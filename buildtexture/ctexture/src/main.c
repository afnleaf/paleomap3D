#include "common.h"

void callError() {
    perror("Error reading file");
}

/**
 * 
 */
size_t getBinFileSize(char* pathToFile) {
    // declare vars
    FILE* fileP = NULL;
    fileP = fopen(pathToFile, "rb");
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

int16_t* openBinFile(char* pathToFile, size_t fileSize) {
    // declare vars
    FILE* fileP = NULL;
    fileP = fopen(pathToFile, "rb");
    int16_t* arr = NULL;
    if(fileP) {
        // allocate memory for int16 array
        arr = (int16_t*)malloc(sizeof(int16_t) * fileSize);
        int16_t buffer;
        // reset to top of file
        fseek(fileP, 0, SEEK_SET);
        // loop through file pointer to get file size
        int i = 0;
        while(fread(&buffer, sizeof(buffer), 1, fileP) == 1) {
            //printf("%d: %d\n", i, buffer);
            //printBits(buf);
            arr[i] = buffer;
            i++;
        }
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

/*
function generateVertices() {
    for (let i = 90.0; i >= -90.0; i -= 0.1 ) {
        for (let j = -180.0; j <= 180.0; j += 0.1) {
            latlon.push([i, j])
        }
    }
}
*/
/*
for (float i = 90.0; i >= -90.0; i -= 0.1 ) {
    for (float j = -180.0; j <= 180.0; j += 0.1) {
        //printf("<%f> <%f>\n", i, j);
        //coordArr = realloc(coordArr, (c + 1) * sizeof(Coords));
        //coordArr[c].latitude = i;
        //coordArr[c].longitude = j;
        c++;
    }
}
*/

Coords* generateVertices() {
    size_t fileSize = 1801 * 3601;
    Coords* coordArr = (Coords*)malloc(fileSize * sizeof(Coords));
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
    printf("%lu\n", c);
    return coordArr;
}

int main() {
    size_t fileSize = FILE_SIZE;
    // generate all possible coordinates
    Coords* coordArr = generateVertices();
    /*
    for(size_t i = 0; i < fileSize; i++) {
        printf("<%.1f> <%.1f>\n", coordArr[i].latitude, coordArr[i].longitude);
    }
    */
    //char* pathToFile = "../../data_bin/large/Map1.bin";
    char* pathToFile = "./data_bin/large/Map1.bin";
    //size_t fileSize = getBinFileSize(pathToFile);
    int16_t* elevationArr = openBinFile(pathToFile, fileSize);
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
    // free memory
    free(elevationArr);
    free(coordArr);
    return 0;
}


