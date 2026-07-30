/**
 * upload-suncity.mjs
 *
 * 1. Uploads public/suncity-layout.webp → Supabase Storage (maps_images/suncity/layouts/)
 * 2. Inserts a row into the `sites` table for slug='suncity'
 *
 * Usage: node scripts/upload-suncity.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Parse .env.local
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(l => l.split('='))
    .filter(p => p[0] && p[1])
    .map(p => [p[0].trim(), p.slice(1).join('=').trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'maps_images';

// ── 1. Upload map WebP ──────────────────────────────────────────────────────

const layoutPath = path.join(__dirname, '..', 'public', 'suncity-layout.webp');
if (!fs.existsSync(layoutPath)) {
  console.error('❌ public/suncity-layout.webp not found. Run compress-suncity.mjs first.');
  process.exit(1);
}

console.log('\n📤 Uploading suncity-layout.webp to Supabase Storage...');
const layoutData = fs.readFileSync(layoutPath);
const { error: uploadError } = await db.storage
  .from(BUCKET)
  .upload('suncity/layouts/suncity-layout.webp', layoutData, {
    contentType: 'image/webp',
    upsert: true,
  });

if (uploadError) {
  console.error(`❌ Upload failed: ${uploadError.message}`);
} else {
  const sizeKB = (layoutData.length / 1000).toFixed(0);
  console.log(`✅ Uploaded suncity-layout.webp (${sizeKB} KB)`);
}

// ── 2. Upload logos (if they exist in public/) ──────────────────────────────

const logos = [
  { local: 'public/extension.png', remote: 'suncity/logos/extension.png', type: 'image/png' },
  { local: 'public/anantam.png',   remote: 'suncity/logos/anantam.png',   type: 'image/png' },
];

for (const logo of logos) {
  const fullPath = path.join(__dirname, '..', logo.local);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${logo.local} — file not found (place it in public/ first)`);
    continue;
  }
  process.stdout.write(`⏳ Uploading ${logo.remote}... `);
  const fileData = fs.readFileSync(fullPath);
  const { error } = await db.storage.from(BUCKET).upload(logo.remote, fileData, { contentType: logo.type, upsert: true });
  if (error) console.log(`❌ ${error.message}`);
  else console.log(`✅ Done`);
}

// ── 3. Insert site row into Supabase `sites` table ─────────────────────────

console.log('\n📋 Inserting Suncity into `sites` table...');
const { data: existing } = await db.from('sites').select('id').eq('slug', 'suncity').single();

if (existing) {
  console.log(`ℹ️  A site with slug='suncity' already exists (id: ${existing.id}). Skipping insert.`);
} else {
  const { data: inserted, error: insertError } = await db.from('sites').insert({
    name: 'Suncity',
    slug: 'suncity',
    svg_width: 5247,
    svg_height: 4176,
    is_active: true,
  }).select().single();

  if (insertError) {
    console.error(`❌ Insert failed: ${insertError.message}`);
    console.log('\n💡 Manual fallback — run this SQL in Supabase Table Editor:');
    console.log(`
INSERT INTO sites (name, slug, svg_width, svg_height, is_active)
VALUES ('Suncity', 'suncity', 5247, 4176, true);
    `);
  } else {
    console.log(`✅ Inserted site: id=${inserted.id}, slug=suncity`);
    console.log(`\n📌 Site ID to use for site_users assignments: ${inserted.id}`);
  }
}

console.log('\n🎉 Suncity upload complete!\n');
