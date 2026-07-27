/**
 * compress-mangalam.mjs
 *
 * Compresses images from /elevations/ into HQ WebP files
 * and places them in /public/images/ for Mangalam map amenities.
 *
 * Usage: node scripts/compress-mangalam.mjs
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR  = path.join(__dirname, '..', 'elevations');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');

const MAX_WIDTH = 1920;
const QUALITY   = 85;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const MAP = [
  { src: 'Entrance.png',                 out: 'entrance.webp' },
  { src: 'Multi Sports Plaza 2.png',     out: 'sportsplaza_2.webp' },
  { src: 'Multi Sports Plaza 3.png',     out: 'sportsplaza_3.webp' },
  { src: 'Multi Sports Plaza 4.png',     out: 'sportsplaza_4.webp' },
  { src: 'Multi purpose Lawn.png',       out: 'multipurpose_lawn.webp' },
  { src: 'Recreational Area 2.png',      out: 'clubhouse_2.webp' },
  { src: 'Temple area (2).png',          out: 'temple_area_2.webp' },
  { src: 'commercial shops.png',         out: 'commercial_shops.webp' }
];

console.log('\n📂 Compressing Mangalam amenity images → HQ WebP\n');

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
console.log(`\n📁 Output: public/images/\n`);
