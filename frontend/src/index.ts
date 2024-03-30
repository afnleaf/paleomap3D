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

// get the file names of the csv files and push them to an array
let filePaths = [];
const csvPath = "./public/csv_files";
const csvFiles = Glob.sync(`${csvPath}/*.csv`);
console.log(csvFiles.length);
for (const fileName of csvFiles) {
    filePaths.push(fileName);
}

// iterate over the csv files and create http routes for the app
filePaths.forEach((filePath, index) => {
    const routePath = `/csv${index}`;
    console.log(`route: ${routePath} for ${filePath}`);
    app.get(routePath, () => Bun.file(filePath));
});

// port
app.listen(PORT);

// hello
console.log(
    `Frontend is running at ${app.server?.hostname}:${app.server?.port}`
);



