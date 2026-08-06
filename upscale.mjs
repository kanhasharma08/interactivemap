import sharp from 'sharp';
import fs from 'fs';

const input = '360/360MS.jpeg';
const output = 'public/panorama/panorama.webp';

console.log('Generating 8K high-res panorama...');
sharp(input)
  .resize(8192, 4096, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .webp({ quality: 90, effort: 6 })
  .toFile(output)
  .then(info => {
    console.log(`Success! File size: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error processing image:', err);
    process.exit(1);
  });
