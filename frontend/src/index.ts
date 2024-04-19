import { Elysia } from 'elysia';
import zlib from 'zlib';
import { gzipSync } from 'zlib';
import { html } from '@elysiajs/html';
import { cors } from '@elysiajs/cors';
import { compression } from 'elysia-compression';
import Glob from 'glob';

const PORT = process.env.PORT || 3333;

// for logging purposes
let num_visitors: number = 0;

// create new app with some tools
const app = new Elysia();
app.use(cors());
app.use(html());
// compression gzip
// doesnt work with () => Bun.file()?
app.use(compression());

// create get routes
// homepage
app.get("/", () => {
    num_visitors += 1;
    console.log(`omg a visitor ${num_visitors}`);
    return Bun.file("./public/index.html");
});

/*
Bun.serve({
    fetch(req) {   
      const compressed = Bun.gzipSync(htmlString);
      return new Response(compressed, { 
        headers: { 
          'Content-Type': 'text/html',
          'Content-Encoding': 'gzip' 
        }
      })
    }
  })
*/
//.headers.get("Content-Type")
//app.get("/styles.css", () => new Response(Bun.file("./public/styles.css")).headers.get("Content-Type"));
//app.get("/styles.css", () => Bun.file("./public/styles.css"));

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
                'Content-Type': 'text/css',
                'Content-Encoding': 'gzip',
            },
        });
    } catch (error) {
        console.error('Error compressing styles.css:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});
*/

app.get("/styles.css", async () => {
    try {
        // Read file contents
        const fileContents = await Bun.file("./public/styles.css");
        
        // Convert BunFile to Uint8Array
        const arrayBuffer = await fileContents.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Compress file contents asynchronously
        const compressed: Uint8Array = await new Promise((resolve, reject) => {
            zlib.gzip(uint8Array, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result as Uint8Array);
                }
            });
        });

        // Send compressed content with appropriate headers
        return new Response(compressed, {
            headers: {
                'Content-Type': 'text/css', // Update content type if it's CSS
                'Content-Encoding': 'gzip',
            },
        });
    } catch (error) {
        console.error('Error compressing styles.css:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});

app.get("/script.js", () => Bun.file("./public/script.js"));
app.get("/maps.js", () => Bun.file("./public/maps.js"));
// favicons
app.get("/favicon-32x32.png", () => Bun.file("./public/images/favicon-32x32.png"));
app.get("/favicon-16x16.png", () => Bun.file("./public/images/favicon-16x16.png"));
app.get("/favicon.ico", () => Bun.file("./public/images/favicon.ico"));
// spacebox texture
app.get("/back.png", () => Bun.file("./public/images/back.png"));
app.get("/bottom.png", () => Bun.file("./public/images/bottom.png"));
app.get("/front.png", () => Bun.file("./public/images/front.png"));
app.get("/left.png", () => Bun.file("./public/images/left.png"));
app.get("/right.png", () => Bun.file("./public/images/right.png"));
app.get("/top.png", () => Bun.file("./public/images/top.png"));

// get the file names of the bin files
const binPathSmall = "/app/data_bin/small";
const binPathLarge = "/app/data_bin/large";
const binFilesSmall = Glob.sync(`${binPathSmall}/*.bin`);
const binFilesLarge = Glob.sync(`${binPathLarge}/*.bin`);

// sort files numerically ascending based on first digit sequence of filename
// otherwise they go by alphabetical
function sortBinFiles(binFiles: string[]): string[] {
    return binFiles.sort((a, b) => {
        const regex = /(\d+)/g;
        let numA: number | undefined;
        let numB: number | undefined;
        if (a != null && b != null) {
            numA = parseInt(a.match(regex)![0]);
            numB = parseInt(b.match(regex)![0]);
        }
        if (numA != null && numB != null) {
            return numA - numB;
        } else {
            return 0;
        }
    });
}

const sortedBinFilesSmall = sortBinFiles(binFilesSmall);
const sortedBinFilesLarge = sortBinFiles(binFilesLarge);

// iterate over the binary files and create http routes for the app
sortedBinFilesSmall.forEach((binFilePath, index) => {
    const routePath = `/small${index}`;
    console.log(`route: ${routePath} for ${binFilePath}`);
    app.get(routePath, () => Bun.file(binFilePath));
});

sortedBinFilesLarge.forEach((binFilePath, index) => {
    const routePath = `/large${index}`;
    console.log(`route: ${routePath} for ${binFilePath}`);
    app.get(routePath, () => Bun.file(binFilePath));
});


// port
app.listen(PORT);

// hello
console.log(
    `Frontend is running at  http://${app.server?.hostname}:${app.server?.port}`
);
