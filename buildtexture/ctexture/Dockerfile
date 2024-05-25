FROM debian:latest

# get the build tools
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y build-essential
RUN apt-get install -y valgrind
# other packages
RUN apt-get install -y libpng-dev

# copy code in
WORKDIR /build
COPY . .
# compile
RUN gcc -I./include -o bin/main src/main.c -lpng -lm

CMD ["./bin/main"]
#valgrind --leak-check=full ./bin/main
#CMD ["valgrind", "--leak-check=full", "./bin/main"]

