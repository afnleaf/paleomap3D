// node modules
import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { cors } from "@elysiajs/cors";
import { compression } from "elysia-compression";
import Glob from "glob";
import { exec } from 'child_process';
// src modules
import compressor from "./compressor.ts";

const PORT = process.env.PORT || 3333;

// for logging purposes
let num_visitors: number = 0;

// create new app with some tools
const app = new Elysia();
app.use(cors());
app.use(html());
// compression gzip
// doesn't work with () => Bun.file()?
// does it work with compressor?
app.use(compression());

// create get routes, pass all the file paths through compressor
// homepage
app.get("/", () => {
    // half bake visitor logging
    num_visitors += 1;
    console.log(`omg a visitor ${num_visitors}`);
    return compressor("./public/index.html");
});
app.get("/styles.css", () => compressor("./public/styles.css"));
app.get("/script.js", () => compressor("./public/script.js"));
app.get("/maps.js", () => compressor("./public/maps.js"));
// favicons
app.get("/favicon-32x32.png", () => compressor("./public/images/favicon-32x32.png"));
app.get("/favicon-16x16.png", () => compressor("./public/images/favicon-16x16.png"));
app.get("/favicon.ico", () => compressor("./public/images/favicon.ico"));
// spacebox texture
app.get("/back.png", () => compressor("./public/images/back.png"));
app.get("/bottom.png", () => compressor("./public/images/bottom.png"));
app.get("/front.png", () => compressor("./public/images/front.png"));
app.get("/left.png", () => compressor("./public/images/left.png"));
app.get("/right.png", () => compressor("./public/images/right.png"));
app.get("/top.png", () => compressor("./public/images/top.png"));

// get the file names of the bin files
const binPathSmall = "/app/data_bin/small";
const binPathLarge = "/app/data_bin/large";
const binFilesSmall = Glob.sync(`${binPathSmall}/*.bin`);
const binFilesLarge = Glob.sync(`${binPathLarge}/*.bin`);

// get the file names of the texture files
const texturePathSmall = "/app/data_texture/textures_small";
const texturePathLarge = "/app/data_texture/textures_large";
const textureSmall = Glob.sync(`${texturePathSmall}/*.png`);
const textureLarge = Glob.sync(`${texturePathLarge}/*.png`);

// sort files numerically ascending based on first digit sequence of filename
// otherwise they go by alphabetical
function sortFiles(binFiles: string[]): string[] {
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

// sort bin files
const sortedBinFilesSmall = sortFiles(binFilesSmall);
const sortedBinFilesLarge = sortFiles(binFilesLarge);

// sort texture files
const sortedTextureSmall = sortFiles(textureSmall);
const sortedTextureLarge = sortFiles(textureLarge);

// iterate over the binary files and create http routes for the app
sortedBinFilesSmall.forEach((binFilePath, index) => {
    const routePath = `/small${index}`;
    console.log(`route: ${routePath} for ${binFilePath}`);
    app.get(routePath, () => compressor(binFilePath));
});

sortedBinFilesLarge.forEach((binFilePath, index) => {
    const routePath = `/large${index}`;
    console.log(`route: ${routePath} for ${binFilePath}`);
    app.get(routePath, () => compressor(binFilePath));
});

// iterate over the texture files and create http routes for the app
sortedTextureSmall.forEach((texturePath, index) => {
    const routePath = `/smalltexture${index}`;
    console.log(`route: ${routePath} for ${texturePath}`);
    app.get(routePath, () => compressor(texturePath));
});

sortedTextureLarge.forEach((texturePath, index) => {
    const routePath = `/largetexture${index}`;
    console.log(`route: ${routePath} for ${texturePath}`);
    app.get(routePath, () => compressor(texturePath));
});

/*
// webhook for automatic deployment
app.post('/push', async ({ body }: { body: { [key: string]: any } }) => {
    console.log('Webhook triggered.');
    const ref = body["ref"];
    if(ref) {
        if(ref === "refs/heads/main") {
            console.log("Deploying to main.");
            try {
                const output = await new Promise((resolve, reject) => {
                    //exec('/home/x230/prod/paleomap3d/deployprod.sh', (error, stdout, stderr) => {
                    exec('/app/deployprod.sh', (error, stdout, stderr) => {
                        if (error) {
                            console.error(`exec error: ${error}`);
                            reject(error);
                        } else {
                            resolve(stdout);
                        }
                    });
                });
                console.log('Deployment successful:', output);
                return { status: 'success', message: 'Deployment completed' };
            } catch (error) {
                console.error('Deployment failed:', error);
                return { status: 'error', message: 'Deployment failed' };
            }
        } else {
            console.log("Not main branch. No deployment triggered.");
        }
    } else {
        console.log("Undefined ref.");
    }
    return { status: 'no_action', message: 'No deployment triggered' };
});
*/

/*
app.post('/push', async ({ body }: { body: { [key: string]: any } }) => {
    console.log('Webhook triggered.');
    const ref = body["ref"];
    if(ref) {
        const branchName = ref.replace(/^refs\/heads\//, "");
        console.log(branchName);
        if(branchName.toLowerCase() === "main") {
            console.log("Deploying to main.");
            // run a deployment script
            return new Promise((resolve, reject) => {
                exec('../../deployprod.sh', (error, stdout, stderr) => {
                    if (error) {
                    reject(error);
                    } else {
                    resolve(stdout);
                    }
                });
            });
        } else {
            console.log("Not main.");
        }
    } else {
        console.log("Undefined ref.");
    }
});
*/

//test
//test
//test
//test
//test

// port
app.listen(PORT);

// hello
console.log(
    `Frontend is running at  http://${app.server?.hostname}:${app.server?.port}`
);
