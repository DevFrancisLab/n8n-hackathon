import fs from "node:fs";

let source = fs.readFileSync(new URL("../../src/lib/data/movies.ts", import.meta.url), "utf8");
source = source.replace(/import type \{ Movie \} from "@\/types";\s*/, "");
source = source.replace(/\/\*\*[\s\S]*?\*\/\s*/, "");
source = source.replace("export const movies: Movie[] =", "const movies =");
const movies = eval(`${source}\nmovies`);
const destination = new URL("../movies/demo_catalog.json", import.meta.url);
fs.mkdirSync(new URL("../movies/", import.meta.url), { recursive: true });
fs.writeFileSync(destination, JSON.stringify(movies, null, 2));
console.log(movies.length);
