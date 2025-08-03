// node modules
import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { cors } from "@elysiajs/cors";
//import { compression } from "@elysiajs/compression";
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
//app.use(compression());

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
app.get("/favicon-16x16.png", () => compressor("./public/images/icons/favicon-16x16.png"));
app.get("/favicon.ico", () => compressor("./public/images/icons/favicon.ico"));
// icons
app.get("/fullscreen-alt.svg", () => compressor("./public/images/icons/fullscreen-alt.svg"));
app.get("/fullscreen-exit.svg", () => compressor("./public/images/icons/fullscreen-exit.svg"));
app.get("/arrow-left.svg", () => compressor("./public/images/icons/arrow-left.svg"));
app.get("/arrow-right.svg", () => compressor("./public/images/icons/arrow-right.svg"));
// spacebox texture
app.get("/back.png", () => compressor("./public/images/back.png"));
app.get("/bottom.png", () => compressor("./public/images/bottom.png"));
app.get("/front.png", () => compressor("./public/images/front.png"));
app.get("/left.png", () => compressor("./public/images/left.png"));
app.get("/right.png", () => compressor("./public/images/right.png"));
app.get("/top.png", () => compressor("./public/images/top.png"));
// experimental bevy htmlpacker app
app.get("/planet.html", () => compressor("./public/planet.html"))

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

// get the file names of the gplates files
const borderPath = "/app/data_texture/textures_border";
const borders = Glob.sync(`${borderPath}/*.png`);
const platePath = "/app/data_texture/textures_plate";
const plates = Glob.sync(`${platePath}/*.png`);

// gplates political border test
//const gplate_political = "./fileout.png";
//app.get("/fileout.png", () => compressor("./fileout.png"));

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

// sort gplates files
const sortedBorders = sortFiles(borders);
const sortedPlates = sortFiles(plates);

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

// iterate over the gplates files and create https routes for the app
sortedBorders.forEach((path, index) => {
    const routePath = `/border${index}`;
    console.log(`route: ${routePath} for ${path}`);
    app.get(routePath, () => compressor(path));
});

sortedPlates.forEach((path, index) => {
    const routePath = `/plate${index}`;
    console.log(`route: ${routePath} for ${path}`);
    app.get(routePath, () => compressor(path));
});

// port
app.listen(PORT);

// hello
console.log(
    `Frontend is running at  http://${app.server?.hostname}:${app.server?.port}`
);
