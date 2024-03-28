import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { cors } from '@elysiajs/cors'
const PORT = process.env.PORT || 3001;

const app = new Elysia();
app.use(cors());
app.use(html());

// homepage
app.get("/", () => Bun.file("./public/index.html"));
//app.get("/styles.css", () => Bun.file("./public/styles.css"))
app.get("/script.js", () => Bun.file("./public/script.js"));
//app.get("/csv", () => Bun.file("./public/csv_files/Map01_000Ma.csv"));
app.get("/csv", () => Bun.file("./public/csv_files/Map74_425Ma.csv"));

// port
app.listen(PORT);

console.log(
    `Frontend is running at ${app.server?.hostname}:${app.server?.port}`
);
