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

// get the file names of the csv files and push them to an array
let fileNames = [];
const csvPath = "csv_files";
const csvFiles = Glob.sync(`${csvPath}/*.csv`);
console.log(csvFiles.length);
for (const fileName of csvFiles) {
    fileNames.push(fileName);
}

// iterate over the csv files and create http routes for the app
fileNames.forEach((filename, index) => {
    const routePath = `/csv${index}`;
    const filePath = `./public/${filename}`;
    console.log(`route: ${routePath} for ${filePath}`);
    app.get(routePath, () => Bun.file(filePath));
});

// port
app.listen(PORT);

// hello
console.log(
    `Frontend is running at ${app.server?.hostname}:${app.server?.port}`
);



