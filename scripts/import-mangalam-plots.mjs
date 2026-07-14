/**
 * import-mangalam-plots.mjs
 *
 * Reads "mangalam plot data.xlsx" and updates matching plots in Supabase DB.
 * Matches by plot label (e.g. "A1", "B3").
 * Skips plots not found in DB (amenity plots, etc.).
 * Does NOT modify: x, y, width, height, id, price, description, bounds.
 *
 * Status mapping:
 *   BOOKED    → status: 'sold'
 *   AVAILABLE → status: 'available',  type: unchanged (if already set) or 'Residential'
 *   PRIMIUM   → status: 'available',  type: 'Premium'
 *   MORTGAGE  → status: 'reserved',   type: 'Mortgage'
 *
 * Facing mapping:
 *   EAST  → 'East'
 *   WEST  → 'West'
 *   NORTH → 'North'
 *
 * Area text format: e.g. "2854 Sq ft (51.17 × 55.76)"
 *
 * Credentials are read from .env.local — never hardcode secrets here.
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config — reads from .env.local (never commit secrets) ───────────────────

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}

const env = loadEnv(path.join(__dirname, '..', '.env.local'));

const SUPABASE_URL         = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const SITE_SLUG            = 'mangalamcity';
const EXCEL_PATH           = path.join(__dirname, '..', 'mangalam plot data.xlsx');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(excelStatus, excelType) {
  const s = (excelStatus || '').trim().toUpperCase();
  if (s === 'BOOKED')    return { status: 'sold',      type: excelType };
  if (s === 'PRIMIUM')   return { status: 'available', type: 'Premium' };
  if (s === 'MORTGAGE')  return { status: 'reserved',  type: 'Mortgage' };
  if (s === 'AVAILABLE') return { status: 'available', type: excelType };
  return { status: 'available', type: excelType }; // fallback
}

function mapFacing(excelFacing) {
  const f = (excelFacing || '').trim().toUpperCase();
  if (f === 'EAST')  return 'East';
  if (f === 'WEST')  return 'West';
  if (f === 'NORTH') return 'North';
  if (f === 'SOUTH') return 'South';
  return 'N/A';
}

function buildAreaText(sqft, w, d) {
  const rounded = Math.round(sqft);
  const wR = Math.round(w * 100) / 100;
  const dR = Math.round(d * 100) / 100;
  return `${rounded} Sq ft (${wR}×${dR})`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📂 Reading Excel file…');
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Skip header rows (row 0 = titles, row 1 = sub-headers)
  const dataRows = rows.slice(2).filter(r => r[0] && String(r[0]).trim() !== '');
  console.log(`📊 Found ${dataRows.length} data rows in Excel`);

  // Build a map: label → excel data
  const excelMap = new Map();
  for (const row of dataRows) {
    const label   = String(row[0]).trim();        // PLOT NO  e.g. "A1"
    const facing  = String(row[1]).trim();        // PLOT FACING
    const w       = parseFloat(row[2]) || 0;     // W (ft)
    const d       = parseFloat(row[3]) || 0;     // D (ft)
    const sqft    = parseFloat(row[4]) || 0;     // AREA SQ FT
    const statusRaw = String(row[5]).trim();      // STATUS

    excelMap.set(label, { label, facing, w, d, sqft, statusRaw });
  }

  // ── Fetch site id ──
  console.log(`\n🔍 Fetching site ID for slug "${SITE_SLUG}"…`);
  const { data: siteData, error: siteErr } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', SITE_SLUG)
    .single();

  if (siteErr || !siteData) {
    console.error('❌ Site not found:', siteErr?.message);
    process.exit(1);
  }
  const siteId = siteData.id;
  console.log(`✅ Site ID: ${siteId}`);

  // ── Fetch all existing plots ──
  console.log(`\n📥 Fetching all plots from DB…`);
  const { data: dbPlots, error: plotsErr } = await supabase
    .from('plots')
    .select('*')
    .eq('site_id', siteId);

  if (plotsErr) {
    console.error('❌ Error fetching plots:', plotsErr.message);
    process.exit(1);
  }
  console.log(`✅ Found ${dbPlots.length} plots in DB`);

  // Build a lookup: label → db row
  const dbMap = new Map();
  for (const p of dbPlots) {
    dbMap.set(String(p.label).trim(), p);
  }

  // ── Match and build updates ──
  const updates = [];
  const skipped = [];
  const notFound = [];

  for (const [label, excel] of excelMap.entries()) {
    const dbRow = dbMap.get(label);
    if (!dbRow) {
      notFound.push(label);
      continue;
    }

    // Determine existing type (for BOOKED/AVAILABLE, preserve existing unless it's N/A)
    let existingType = dbRow.type || 'Residential';
    if (existingType === 'N/A') existingType = 'Residential';
    if (existingType === 'Amenity') {
      // Don't touch amenity plots
      skipped.push(label);
      continue;
    }

    const { status, type: mappedType } = mapStatus(excel.statusRaw, existingType);
    const facing = mapFacing(excel.facing);
    const sqft = Math.round(excel.sqft);
    const sqm = Math.round(excel.sqft * 0.0929);
    const areaText = buildAreaText(excel.sqft, excel.w, excel.d);

    updates.push({
      id: dbRow.id,
      site_id: siteId,
      status,
      type: mappedType,
      facing,
      size_sqft: sqft,
      size_sqm: sqm,
      area_text: areaText,
    });
  }

  console.log(`\n📝 Matched: ${updates.length} plots to update`);
  console.log(`⏭️  Skipped (amenity): ${skipped.length} — ${skipped.join(', ')}`);
  if (notFound.length > 0) {
    console.log(`⚠️  Not found in DB: ${notFound.length} — ${notFound.join(', ')}`);
  }

  if (updates.length === 0) {
    console.log('\n✅ Nothing to update.');
    return;
  }

  // ── Batch upsert in chunks of 50 ──
  console.log('\n⬆️  Uploading updates to Supabase…');
  const CHUNK_SIZE = 50;
  let done = 0;

  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('plots')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Upsert error at chunk ${i}:`, error.message);
      process.exit(1);
    }
    done += chunk.length;
    process.stdout.write(`\r   Progress: ${done}/${updates.length}`);
  }

  console.log(`\n\n✅ Done! Updated ${done} plots successfully.`);

  // ── Summary ──
  const byStatus = {};
  for (const u of updates) {
    byStatus[u.status] = (byStatus[u.status] || 0) + 1;
  }
  console.log('\n📊 Status breakdown:');
  for (const [s, count] of Object.entries(byStatus)) {
    console.log(`   ${s}: ${count}`);
  }
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
