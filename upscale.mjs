import sharp from 'sharp';
const input = '360/suncity.jpeg';
const output = 'public/panorama/suncity.webp';
console.log('Generating 8K panorama for Suncity...');
sharp(input)
  .resize(8192, 4096, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .webp({ quality: 90, effort: 6 })
  .toFile(output)
  .then(info => {
    console.log(`Success! File size: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
    process.exit(0);
  });
