import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { cors } from '@elysiajs/cors'
import Glob from 'glob';

const PORT = process.env.PORT || 3333;

const app = new Elysia();
app.use(cors());
app.use(html());

// homepage
app.get("/", () => Bun.file("./public/index.html"));
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
const binPath = "./public/data_bin";
const binFiles = Glob.sync(`${binPath}/*.bin`);
// sort files numerically ascending based on first digit sequence of filename
// otherwise they go by alphabetical
const sortedBinFiles = binFiles.sort((a, b) => {
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

// iterate over the csv files and create http routes for the app
sortedBinFiles.forEach((binFilePath, index) => {
    const routePath = `/bin${index}`;
    console.log(`route: ${routePath} for ${binFilePath}`);
    app.get(routePath, () => Bun.file(binFilePath));
});


// port
app.listen(PORT);

// hello
console.log(
    `Frontend is running at ${app.server?.hostname}:${app.server?.port}`
);
