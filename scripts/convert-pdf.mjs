// Run this once to convert Bhaavbhumi layout PDF → ultra-high-res PNG for the map
// Usage: node scripts/convert-pdf.mjs

import { pdfToPng } from 'pdf-to-png-converter';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '..', 'Bhaavbhumi layout.pdf');
const OUT_DIR  = path.join(__dirname, '..', 'public');

async function main() {
  console.log('Converting PDF → PNG at 300 DPI (high quality)...');

  const pages = await pdfToPng(PDF_PATH, {
    disableFontFace: false,
    useSystemFonts: true,
    // 300 DPI gives ~4+ MB crisp image, same quality as print
    viewportScale: 12, // ~1150 DPI effective — ultra-sharp for zooming
    outputFolder: OUT_DIR,
    outputFileMask: 'bhaavbhumi-layout',
    pagesToProcess: [1],  // only first page
    strictPagesToProcess: false,
    verbosityLevel: 0,
  });

  if (pages.length === 0) {
    console.error('❌ No pages extracted! Check the PDF path.');
    process.exit(1);
  }

  console.log(`✅ Saved: ${pages[0].path}`);
  console.log(`   Size:  ${pages[0].width} × ${pages[0].height} px`);
  console.log('');
  console.log('Now update data/sites.ts:');
  console.log(`  svgW: ${pages[0].width},`);
  console.log(`  svgH: ${pages[0].height},`);
}

main().catch(e => { console.error(e); process.exit(1); });
