#FROM gcc:latest
FROM debian:latest

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y build-essential
RUN apt-get install -y valgrind

WORKDIR /build
COPY . .
# compile
RUN gcc -I./include -o bin/main src/main.c

#CMD ["./bin/main"]
#valgrind --leak-check=full ./bin/main
CMD ["valgrind", "--leak-check=full", "./bin/main"]

