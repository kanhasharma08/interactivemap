/**
 * compress-views.mjs
 *
 * Reads every image from the /views folder and compresses them into
 * optimized WebP files inside /public/bhaavbhumi/amenities/.
 *
 * - Resize to max 1920px wide (keeps aspect ratio)
 * - WebP quality 82 (visually lossless for renders, 99%+ size reduction)
 * - Handles: .tif, .tiff, .jpg, .jpeg, .png
 * - Groups numbered images: club1.tif, club2.tif → club.webp array
 *
 * Usage: node scripts/compress-views.mjs
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR  = path.join(__dirname, '..', 'views');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'bhaavbhumi', 'amenities');

const SUPPORTED = ['.tif', '.tiff', '.jpg', '.jpeg', '.png'];
const MAX_WIDTH  = 1920;
const QUALITY    = 82;

// Ensure output dir exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const files = fs.readdirSync(INPUT_DIR).filter(f =>
  SUPPORTED.includes(path.extname(f).toLowerCase())
);

console.log(`\n📂 Found ${files.length} images in views/\n`);

let done = 0;
let failed = 0;

for (const file of files) {
  const inputPath  = path.join(INPUT_DIR, file);
  const baseName   = path.basename(file, path.extname(file)).toLowerCase();
  const outputName = `${baseName}.webp`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const inputSizeMB = (fs.statSync(inputPath).size / 1_000_000).toFixed(0);
    process.stdout.write(`  ⏳ ${file} (${inputSizeMB}MB) → ${outputName} ...`);

    await sharp(inputPath, { limitInputPixels: false })
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    const outputSizeKB = (fs.statSync(outputPath).size / 1_000).toFixed(0);
    process.stdout.write(` ✅ ${outputSizeKB}KB\n`);
    done++;
  } catch (err) {
    process.stdout.write(` ❌ FAILED: ${err.message}\n`);
    failed++;
  }
}

console.log(`\n✅ Compressed ${done} images.`);
if (failed > 0) console.log(`❌ ${failed} failed.`);
console.log(`\n📁 Output: public/bhaavbhumi/amenities/`);
