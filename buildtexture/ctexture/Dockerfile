FROM gcc:latest

WORKDIR /build

COPY . .

# compile
RUN gcc -I./include -o bin/main src/main.c

CMD ["./bin/main"]

