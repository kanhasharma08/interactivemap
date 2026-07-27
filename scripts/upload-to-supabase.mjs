/**
 * upload-to-supabase.mjs
 * 
 * Uploads all images from local public folder to the Supabase maps_images bucket,
 * organizing them into site-specific folders.
 */
import { createClient } from '@supabase/supabase-js';
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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'maps_images';

async function uploadFile(localPath, remotePath) {
  if (!fs.existsSync(localPath)) {
    console.log(`⚠️  NOT FOUND: ${localPath}`);
    return;
  }
  
  const fileData = fs.readFileSync(localPath);
  const contentType = localPath.endsWith('.svg') ? 'image/svg+xml' : 
                      localPath.endsWith('.png') ? 'image/png' : 
                      'image/webp';
                      
  process.stdout.write(`⏳ Uploading ${remotePath}... `);
  
  const { data, error } = await db.storage
    .from(BUCKET)
    .upload(remotePath, fileData, {
      contentType,
      upsert: true
    });
    
  if (error) {
    console.log(`❌ FAILED: ${error.message}`);
  } else {
    console.log(`✅ Success`);
  }
}

async function main() {
  console.log('--- Uploading Bhaavbhumi Assets ---');
  // Layouts
  await uploadFile(
    path.join(__dirname, '..', 'public', 'bhaavbhumi-layout.webp'),
    'bhaavbhumi/layouts/bhaavbhumi-layout.webp'
  );
  
  // Amenities
  const bbAmenitiesDir = path.join(__dirname, '..', 'public', 'bhaavbhumi', 'amenities');
  if (fs.existsSync(bbAmenitiesDir)) {
    const bbFiles = fs.readdirSync(bbAmenitiesDir).filter(f => f.endsWith('.webp') || f.endsWith('.png'));
    for (const file of bbFiles) {
      await uploadFile(path.join(bbAmenitiesDir, file), `bhaavbhumi/amenities/${file}`);
    }
  }

  console.log('\n--- Uploading Mangalam City Assets ---');
  // Layouts
  await uploadFile(
    path.join(__dirname, '..', 'public', 'map-layout-hq-optimized.webp'),
    'mangalamcity/layouts/map-layout-hq-optimized.webp'
  );
  await uploadFile(
    path.join(__dirname, '..', 'public', 'map-layout-optimized.webp'),
    'mangalamcity/layouts/map-layout-optimized.webp'
  );
  await uploadFile(
    path.join(__dirname, '..', 'public', 'map-layout.svg'),
    'mangalamcity/layouts/map-layout.svg' // SVG might be used, let's keep it safe
  );
  
  // Amenities
  const mcAmenitiesDir = path.join(__dirname, '..', 'public', 'images');
  if (fs.existsSync(mcAmenitiesDir)) {
    const mcFiles = fs.readdirSync(mcAmenitiesDir).filter(f => f.endsWith('.webp') || f.endsWith('.png'));
    for (const file of mcFiles) {
      await uploadFile(path.join(mcAmenitiesDir, file), `mangalamcity/amenities/${file}`);
    }
  }
  
  console.log('\n🎉 All uploads completed!');
}

main();
