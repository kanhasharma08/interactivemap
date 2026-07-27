import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const panelPath = path.join(__dirname, '..', 'components', 'PlotDetailPanel.tsx');

let content = fs.readFileSync(panelPath, 'utf8');

// Insert STORAGE_URL at the top after imports
if (!content.includes('STORAGE_URL')) {
  content = content.replace(
    /(import { formatPrice, getStatusColor } from '@\/data\/plots';)/,
    "$1\n\nconst STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps_images`;"
  );
}

// Replace mangalam /images/ with backtick template literal
content = content.replace(/'\/images\/(.*?)'/g, '`${STORAGE_URL}/mangalamcity/amenities/$1`');

// Replace bhaavbhumi single quoted
content = content.replace(/'\/bhaavbhumi\/amenities\/(.*?)'/g, '`${STORAGE_URL}/bhaavbhumi/amenities/$1`');

// Replace bhaavbhumi backticked (in the map function for multi amenities)
content = content.replace(/`\/bhaavbhumi\/amenities\/(.*?)`/g, '`${STORAGE_URL}/bhaavbhumi/amenities/$1`');

fs.writeFileSync(panelPath, content, 'utf8');
console.log('Replacements completed successfully.');
