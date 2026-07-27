import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(l => l.split('='))
    .filter(p => p[0] && p[1])
    .map(p => [p[0].trim(), p.slice(1).join('=').trim()])
);

const testUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps_images/mangalamcity/amenities/clubhouse.webp`;
console.log('Fetching:', testUrl);
fetch(testUrl).then(res => {
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Size:', res.headers.get('content-length'), 'bytes');
}).catch(console.error);
