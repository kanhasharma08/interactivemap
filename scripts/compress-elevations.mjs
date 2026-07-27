/**
 * compress-elevations.mjs
 *
 * Compresses images from /elevations/ into HQ WebP files
 * and places them in /public/bhaavbhumi/amenities/
 *
 * Usage: node scripts/compress-elevations.mjs
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR  = path.join(__dirname, '..', 'elevations');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'bhaavbhumi', 'amenities');

const MAX_WIDTH = 1920;
const QUALITY   = 85;   // HQ — visually lossless for architectural renders

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Explicit mapping: source file → output name
const MAP = [
  // Type 3 West
  { src: 'Type 03 west 2.png',          out: 'type3_west_1.webp' },
  { src: 'Type 03 west 3.png',          out: 'type3_west_2.webp' },
  // Type 4 West
  { src: 'Type 04 west 2.png',          out: 'type4_west_1.webp' },
  { src: 'Type 04 west 3.png',          out: 'type4_west_2.webp' },
  // Type 6 East  (two separate source files)
  { src: 'Type 6 EAST (1).jpg.jpeg',    out: 'type6_east_1.webp' },
  { src: 'Type6 EAST (1).jpg.jpeg',     out: 'type6_east_2.webp' },
  // Type 6 West
  { src: 'Type 6 WEST  (1).jpg.jpeg',   out: 'type6_west_1.webp' },
  { src: 'Type 6 WEST  (2).jpg.jpeg',   out: 'type6_west_2.webp' },
];

console.log('\n📂 Compressing elevation images → HQ WebP\n');

let done = 0, failed = 0;

for (const { src, out } of MAP) {
  const inputPath  = path.join(INPUT_DIR, src);
  const outputPath = path.join(OUTPUT_DIR, out);

  if (!fs.existsSync(inputPath)) {
    console.log(`  ⚠️  NOT FOUND: ${src}  (skipping)`);
    failed++;
    continue;
  }

  // Remove old file if exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log(`  🗑️  Removed old: ${out}`);
  }

  const inputSizeMB = (fs.statSync(inputPath).size / 1_000_000).toFixed(1);
  process.stdout.write(`  ⏳ ${src} (${inputSizeMB} MB) → ${out} ...`);

  try {
    await sharp(inputPath, { limitInputPixels: false })
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(outputPath);

    const outputSizeKB = (fs.statSync(outputPath).size / 1_000).toFixed(0);
    process.stdout.write(` ✅ ${outputSizeKB} KB\n`);
    done++;
  } catch (err) {
    process.stdout.write(` ❌ FAILED: ${err.message}\n`);
    failed++;
  }
}

console.log(`\n✅ Compressed ${done} images.`);
if (failed > 0) console.log(`❌ ${failed} failed / not found.`);
console.log(`\n📁 Output: public/bhaavbhumi/amenities/\n`);
