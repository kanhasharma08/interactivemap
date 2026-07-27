/**
 * migrate-images-to-db.mjs
 *
 * ONE-TIME SCRIPT — populates the hero_images column for all plots
 * using the exact same rules currently in PlotDetailPanel.tsx.
 *
 * Run: node scripts/migrate-images-to-db.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').map(l => l.split('=')).filter(p => p[0] && p[1])
    .map(p => [p[0].trim(), p.slice(1).join('=').trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const STORAGE_URL = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps_images`;

// ── Exact replica of getMangalamHero ────────────────────────────────────────
function getMangalamImages(plot) {
  const lowerLabel = plot.label.toLowerCase().trim();

  if (lowerLabel.includes('clubhouse') || lowerLabel.includes('club house') || lowerLabel.includes('milaya') || lowerLabel.includes('recreational'))
    return [`${STORAGE_URL}/mangalamcity/amenities/clubhouse.webp`, `${STORAGE_URL}/mangalamcity/amenities/clubhouse_2.webp`];
  if (lowerLabel.includes('tunnel'))
    return [`${STORAGE_URL}/mangalamcity/amenities/Relaxing tunnel garden.webp`];
  if (lowerLabel.includes('relaxing garden') || lowerLabel.includes('relazxing'))
    return [`${STORAGE_URL}/mangalamcity/amenities/relazxing garden.webp`];
  if (lowerLabel.includes('sport'))
    return [`${STORAGE_URL}/mangalamcity/amenities/sportsplaza.webp`, `${STORAGE_URL}/mangalamcity/amenities/sportsplaza_2.webp`, `${STORAGE_URL}/mangalamcity/amenities/sportsplaza_3.webp`, `${STORAGE_URL}/mangalamcity/amenities/sportsplaza_4.webp`];
  if (lowerLabel.includes('garden near temple') || lowerLabel.includes('temple garden'))
    return [`${STORAGE_URL}/mangalamcity/amenities/garden near temple.webp`];
  if (lowerLabel.includes('temple'))
    return [`${STORAGE_URL}/mangalamcity/amenities/temple area.webp`, `${STORAGE_URL}/mangalamcity/amenities/temple_area_2.webp`];
  if (lowerLabel.includes('entrance'))
    return [`${STORAGE_URL}/mangalamcity/amenities/entrance.webp`];
  if (lowerLabel.includes('lawn') || lowerLabel.includes('multi purpose'))
    return [`${STORAGE_URL}/mangalamcity/amenities/multipurpose_lawn.webp`];
  if (lowerLabel.includes('commercial') || lowerLabel.includes('shop'))
    return [`${STORAGE_URL}/mangalamcity/amenities/commercial_shops.webp`];
  return [];
}

// ── Exact replica of getBhaavbhumiHero ──────────────────────────────────────
function getBhaavbhumiImages(plot) {
  const lowerLabel = plot.label.toLowerCase().trim().replace(/\s+/g, '_');
  const lowerType  = (plot.type ?? '').toLowerCase().trim();
  const facing     = (plot.facing ?? '').toUpperCase();

  // Type 2
  if (lowerType === 'type 2' || lowerType === 'type2') {
    if (facing === 'EAST')
      return [`${STORAGE_URL}/bhaavbhumi/amenities/type2_east_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type2_east_2.webp`];
    return []; // West — no image yet
  }

  // Type 3
  if (lowerType === 'type 3' || lowerType === 'type3') {
    if (facing === 'WEST')
      return [`${STORAGE_URL}/bhaavbhumi/amenities/type3_west_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type3_west_2.webp`];
    return [`${STORAGE_URL}/bhaavbhumi/amenities/type3_houses.webp`]; // East
  }

  // Type 4
  if (lowerType === 'type 4' || lowerType === 'type4') {
    if (facing === 'WEST')
      return [`${STORAGE_URL}/bhaavbhumi/amenities/type4_west_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type4_west_2.webp`];
    return [`${STORAGE_URL}/bhaavbhumi/amenities/type4_east_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type4_east_2.webp`]; // East
  }

  // Type 5
  if (lowerType === 'type 5' || lowerType === 'type5') {
    if (facing === 'WEST')
      return [`${STORAGE_URL}/bhaavbhumi/amenities/type5_west_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type5_west_2.webp`];
    return [`${STORAGE_URL}/bhaavbhumi/amenities/type5_houses1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type5_houses2.webp`]; // East
  }

  // Type 6
  if (lowerType === 'type 6' || lowerType === 'type6') {
    if (facing === 'EAST')
      return [`${STORAGE_URL}/bhaavbhumi/amenities/type6_east_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type6_east_2.webp`];
    return [`${STORAGE_URL}/bhaavbhumi/amenities/type6_west_1.webp`, `${STORAGE_URL}/bhaavbhumi/amenities/type6_west_2.webp`]; // West
  }

  // Multi-image amenities
  const multiMap = {
    'club':             ['club1', 'club2', 'club3', 'club4'],
    'multi_sport_court':['multi_sport_court1', 'multi_sport_court2'],
    'nukkad':           ['nukkad'],
    'poorva_maya':      ['poorva_maya', 'poorva_maya2'],
    'utsav_baag':       ['utsav_baag1', 'utsav_baag2'],
  };
  for (const [key, files] of Object.entries(multiMap)) {
    if (lowerLabel.includes(key.replace('_', ' ')) || lowerLabel.includes(key))
      return files.map(f => `${STORAGE_URL}/bhaavbhumi/amenities/${f}.webp`);
  }

  // Single-image amenities
  const singleMap = {
    'agni':       'agni_court',
    'anand':      'anand_baag',
    'ankuram':    'ankuram_court',
    'experience': 'experience_centre',
    'hans':       'hans_vatika',
    'entrance':   'main_entrance',
    'jungle':     'jungle_camp',
    'kids':       'kids_play_area',
    'niruti':     'niruti_court',
    'spring':     'spring_circle',
    'varun':      'varun_court',
    'vayu':       'vayu_court',
    'gym':        'indoor_gym',
  };
  for (const [key, file] of Object.entries(singleMap)) {
    if (lowerLabel.includes(key))
      return [`${STORAGE_URL}/bhaavbhumi/amenities/${file}.webp`];
  }

  return [];
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Fetch all sites
  const { data: sites, error: sErr } = await db.from('sites').select('id, slug, name');
  if (sErr) { console.error('Could not fetch sites:', sErr.message); process.exit(1); }

  let totalUpdated = 0, totalSkipped = 0;

  for (const site of sites) {
    const { data: plots, error: pErr } = await db.from('plots').select('id, label, type, facing').eq('site_id', site.id);
    if (pErr) { console.error(`Could not fetch plots for ${site.slug}:`, pErr.message); continue; }

    console.log(`\n── ${site.name} (${plots.length} plots) ──`);

    const updates = [];
    for (const plot of plots) {
      const images = site.slug === 'bhaavbhumi'
        ? getBhaavbhumiImages(plot)
        : getMangalamImages(plot);

      if (images.length > 0) {
        updates.push({ id: plot.id, hero_images: images });
        console.log(`  ✅ ${plot.label.padEnd(12)} → ${images.length} image(s)`);
      } else {
        totalSkipped++;
      }
    }

    // Batch update in chunks of 50
    const CHUNK = 50;
    for (let i = 0; i < updates.length; i += CHUNK) {
      const chunk = updates.slice(i, i + CHUNK);
      for (const u of chunk) {
        const { error } = await db.from('plots').update({ hero_images: u.hero_images }).eq('id', u.id);
        if (error) console.error(`  ❌ Failed ${u.id}:`, error.message);
        else totalUpdated++;
      }
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Updated : ${totalUpdated} plots with images`);
  console.log(`   Skipped : ${totalSkipped} plots (no image for this type/facing)`);
}

main();
