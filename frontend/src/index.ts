import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { cors } from '@elysiajs/cors'
import Glob from 'glob';

const PORT = process.env.PORT || 3333;

// for logging purposes
let num_visitors = 0;

const app = new Elysia();
app.use(cors());
app.use(html());

// get routes
// homepage
app.get("/", () => {
    num_visitors += 1;
    console.log(`omg a visitor ${num_visitors}`);
    return Bun.file("./public/index.html")   
});
app.get("/styles.css", () => Bun.file("./public/styles.css"))
app.get("/script.js", () => Bun.file("./public/script.js"));
app.get("/maps.js", () => Bun.file("./public/maps.js"));
// favicons
app.get("/favicon-32x32.png", () => Bun.file("./public/images/favicon-32x32.png"))
app.get("/favicon-16x16.png", () => Bun.file("./public/images/favicon-16x16.png"))
app.get("/favicon.ico", () => Bun.file("./public/images/favicon.ico"))
// spacebox texture
app.get("/back.png", () => Bun.file("./public/images/back.png"))
app.get("/bottom.png", () => Bun.file("./public/images/bottom.png"))
app.get("/front.png", () => Bun.file("./public/images/front.png"))
app.get("/left.png", () => Bun.file("./public/images/left.png"))
app.get("/right.png", () => Bun.file("./public/images/right.png"))
app.get("/top.png", () => Bun.file("./public/images/top.png"))

// get the file names of the bin files
const binPathSmall = "./public/data_bin_small";
const binPathLarge = "./public/data_bin_large";
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


/*
const sortedBinFilesSmall = binFilesSmall.sort((a, b) => {
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
*/