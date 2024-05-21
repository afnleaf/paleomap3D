#include "common.h"

/**
 * 
 */
void openBinFile(char* pathToFile) {
    // declare vars
    FILE* fileP = NULL;
    size_t size = BUFFER_SIZE;

    fileP = fopen(pathToFile, "r");
    printf("test\n");
    if(fileP) {
        // allocate memory
        //char* buffer = (char*)malloc(sizeof(char) * size);
        u_int32_t buf;
        // reset to top of file
        fseek(fileP, 0, SEEK_SET);
        // loop through file pointer
        int i = 0;
        while(fread(&buf, sizeof(buf), 1, fileP) == 1) {
            printf("%d: %u\n", i, &buf);
            i++;
        }
        fclose(fileP);
    }

}

int main() {
    char* pathToFile = "./data_bin/small/Map1.bin";
    openBinFile(pathToFile);
    return 0;
}


