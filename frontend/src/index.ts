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
//app.get("/csv53", () => Bun.file("./public/csv_files/Map51.5_265Ma.csv"));
//app.get("/csv", () => Bun.file("./public/csv_files/Map74_425Ma.csv"));
//app.get("/csv0", () => Bun.file("./public/csv_files/Map01_000Ma.csv"));


// Array of filenames
const filenames = [
    "Map01_000Ma.csv", "Map03_005Ma.csv", "Map05_010Ma.csv", "Map06_015Ma.csv", "Map07_020Ma.csv",
    "Map08_025Ma.csv", "Map09_030Ma.csv", "Map10_035Ma.csv", "Map11_040Ma.csv", "Map12_045Ma.csv",
    "Map13_050Ma.csv", "Map14_055Ma.csv", "Map15_060Ma.csv", "Map16_065Ma.csv", "Map17_070Ma.csv",
    "Map18_075Ma.csv", "Map19_080Ma.csv", "Map20_085Ma.csv", "Map21_090Ma.csv", "Map22_095Ma.csv",
    "Map23_100Ma.csv", "Map24_105Ma.csv", "Map25_110Ma.csv", "Map26_115Ma.csv", "Map27_120Ma.csv",
    "Map28_125Ma.csv", "Map29_130Ma.csv", "Map30_135Ma.csv", "Map31_140Ma.csv", "Map32_145Ma.csv",
    "Map33_150Ma.csv", "Map34_155Ma.csv", "Map35_160Ma.csv", "Map36_165Ma.csv", "Map37_170Ma.csv",
    "Map38_175Ma.csv", "Map39_180Ma.csv", "Map40_185Ma.csv", "Map41_190Ma.csv", "Map42_195Ma.csv",
    "Map43_200Ma.csv", "Map43.5_205Ma.csv", "Map44_210Ma.csv", "Map44.5_215Ma.csv", "Map45_220Ma.csv",
    "Map45.5_225Ma.csv", "Map46_230Ma.csv", "Map46.5_235Ma.csv", "Map47_240Ma.csv", "Map48_245Ma.csv",
    "Map49_250Ma.csv", "Map50_255Ma.csv", "Map51_260Ma.csv", "Map51.5_265Ma.csv", "Map52_270Ma.csv",
    "Map53_275Ma.csv", "Map53.5_280Ma.csv", "Map54_285Ma.csv", "Map55_290Ma.csv", "Map56_295Ma.csv",
    "Map57_300Ma.csv", "Map58_305Ma.csv", "Map59_310Ma.csv", "Map59.5_315Ma.csv", "Map60_320Ma.csv",
    "Map61_325Ma.csv", "Map62_330Ma.csv", "Map62.5_335Ma.csv", "Map63_340Ma.csv", "Map63.5_345Ma.csv",
    "Map64_350Ma.csv", "Map64.5_355Ma.csv", "Map65_360Ma.csv", "Map65.5_365Ma.csv", "Map66_370Ma.csv",
    "Map66.5_375Ma.csv", "Map67_380Ma.csv", "Map67.5_385Ma.csv", "Map68_390Ma.csv", "Map69_395Ma.csv",
    "Map70_400Ma.csv", "Map70.5_405Ma.csv", "Map71_410Ma.csv", "Map72_415Ma.csv", "Map73_420Ma.csv",
    "Map74_425Ma.csv", "Map75_430Ma.csv", "Map75.5_435Ma.csv", "Map76_440Ma.csv", "Map77_445Ma.csv",
    "Map78_450Ma.csv", "Map79_455Ma.csv", "Map80_460Ma.csv", "Map80.5_465Ma.csv", "Map81_470Ma.csv",
    "Map81.5_475Ma.csv", "Map82_480Ma.csv", "Map82.5_485Ma.csv", "Map83_490Ma.csv", "Map83.5_495Ma.csv",
    "Map84_500Ma.csv", "Map84.1_505Ma.csv", "Map84.2_510Ma.csv", "Map85_515Ma.csv", "Map86_520Ma.csv",
    "Map86.5_525Ma.csv", "Map87_530Ma.csv", "Map87.5_535Ma.csv", "Map88_540Ma.csv"
];

// Iterate over the filenames and create routes
filenames.forEach((filename, index) => {
    const routePath = `/csv${index}`;
    const filePath = `./public/csv_files/${filename}`;
    console.log(routePath," - ", filePath);
    app.get(routePath, () => Bun.file(filePath));
});


// port
app.listen(PORT);

console.log(
    `Frontend is running at ${app.server?.hostname}:${app.server?.port}`
);


/*
const csvPath = "csv_files/";
const csvFiles = Glob.sync(`${csvPath}/*.csv`);
console.log(csvFiles.length);
for (const [index, fileName] of csvFiles.entries()) {
    console.log(fileName);
}
*/
