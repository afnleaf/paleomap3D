import zlib from "zlib";

async function compressor(route: string) {
    try {
        // read fil
        const file = Bun.file(route);
        // get Content-Type
        const contentType = new Response(file).headers.get("Content-Type");
        // convert file to single unsigned int byte array
        const uint8Array = new Uint8Array(await file.arrayBuffer());
        // compress file contents asynchronously
        const compressed: Uint8Array = await new Promise((resolve, reject) => {
            zlib.gzip(uint8Array, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result as Uint8Array);
                }
            });
        });
        // compress content with header
        return new Response(compressed, {
            headers: {
                "Content-Type": contentType ?? "application/octet-stream",
                "Content-Encoding": "gzip",
            },
        });
    } catch (error) {
        console.error(`Error compressing ${route}:`, error);
        return new Response(`Internal Server Error, ${{ status: 500 }}`);
    }
}

export default compressor;

/*
Bun.serve({
    fetch(req) {   
      const compressed = Bun.gzipSync(htmlString);
      return new Response(compressed, { 
        headers: { 
          "Content-Type": "text/html",
          "Content-Encoding": "gzip" 
        }
      })
    }
  })
*/
//.headers.get("Content-Type")
//app.get("/styles.css", () => new Response(Bun.file("./public/styles.css")).headers.get("Content-Type"));


/*
// testing compression
app.get("/styles.css", async () => {
    try {
        // why is this green?
        const fileContents = Bun.file("./public/styles.css");
        const uint8Array = new Uint8Array(await fileContents.arrayBuffer());
        const compressed = gzipSync(uint8Array);
        return new Response(compressed, {
            headers: {
                "Content-Type": "text/css",
                "Content-Encoding": "gzip",
            },
        });
    } catch (error) {
        console.error("Error compressing styles.css:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
});
*/