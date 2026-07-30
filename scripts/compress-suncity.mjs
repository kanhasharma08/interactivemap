/**
 * compress-suncity.mjs
 *
 * Compresses Extension.png (9.7 MB) into a high-quality WebP for the Suncity map.
 * Applies mild unsharp mask to improve clarity without distorting the layout.
 *
 * Usage: node scripts/compress-suncity.mjs
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_PATH  = path.join(__dirname, '..', 'Extension.png');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'suncity-layout.webp');

if (!fs.existsSync(INPUT_PATH)) {
  console.error('❌ Extension.png not found at project root. Aborting.');
  process.exit(1);
}

const inputSizeMB = (fs.statSync(INPUT_PATH).size / 1_000_000).toFixed(1);
console.log(`\n📂 Input: Extension.png (${inputSizeMB} MB)`);

// Step 1: Detect dimensions
const metadata = await sharp(INPUT_PATH, { limitInputPixels: false }).metadata();
const { width, height } = metadata;
console.log(`📐 Detected dimensions: ${width} x ${height} px`);
console.log(`   → Use in sites.ts: svgW: ${width}, svgH: ${height}`);

// Step 2: Compress with mild sharpening
// - resize: none (preserve original resolution — map detail matters)
// - sharpen: mild sigma=0.6 to recover lost clarity from JPEG-to-PNG artifacts
// - webp quality: 92 (high fidelity)
process.stdout.write(`\n⏳ Compressing + sharpening → public/suncity-layout.webp ...`);

await sharp(INPUT_PATH, { limitInputPixels: false })
  .sharpen({
    sigma: 0.6,     // subtle, won't ring or halo on text/lines
    m1: 1.5,        // flat areas boost (light)
    m2: 0.4,        // edge boost (subtle)
    x1: 2,
    y2: 15,
    y3: 6,
  })
  .webp({
    quality: 92,
    effort: 5,
    smartSubsample: true,
  })
  .toFile(OUTPUT_PATH);

const outputSizeKB = (fs.statSync(OUTPUT_PATH).size / 1_000).toFixed(0);
console.log(` ✅ Done!`);
console.log(`\n📦 Output: public/suncity-layout.webp (${outputSizeKB} KB)`);
console.log(`\n✅ Add this to data/sites.ts:`);
console.log(`   svgW: ${width},`);
console.log(`   svgH: ${height},`);
console.log(`\n📁 Next: run  node scripts/upload-suncity.mjs\n`);
