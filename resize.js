import fs from "fs";
import sharp from "sharp";

const inDir = "./public/practicals-diagrams";
const outDir = "./public/practicals-diagrams/resized";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs
  .readdirSync(inDir)
  .filter(
    (f) => f.endsWith(".png") || f.endsWith(".jpeg") || f.endsWith(".jpg"),
  );

Promise.all(
  files.map((file) => {
    return sharp(`${inDir}/${file}`)
      .resize({ width: 600, withoutEnlargement: true })
      .toFile(`${outDir}/${file}`)
      .then(() => console.log(`Resized ${file}`));
  }),
)
  .then(() => console.log("All done!"))
  .catch((err) => console.error(err));
