import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runSync() {
  const workbook = xlsx.readFile('BB PLOT SIZE.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'bhaavbhumi').single();
  if (!site) return console.log('Site not found');
  
  const { data: dbPlots } = await supabaseAdmin.from('plots').select('*').eq('site_id', site.id);
  if (!dbPlots) return console.log('No DB plots found');
  
  const dbPlotMap = new Map();
  for (const p of dbPlots) {
    dbPlotMap.set(p.label.toUpperCase().replace(/\s/g, ''), p);
  }

  let updatedCount = 0;
  
  for (const row of data) {
    if (!row.BLOCK || !row['NO.']) continue;
    const label = `${row.BLOCK}${row['NO.']}`.toUpperCase().replace(/\s/g, '');
    const dbPlot = dbPlotMap.get(label);
    
    if (dbPlot) {
      const avail = (row.Availibility || '').toString().toLowerCase();
      let status = 'available';
      if (avail === 'booked' || avail === 'sold') {
        status = 'sold';
      } else if (avail === 'mortgage' || avail === 'reserved') {
        status = 'reserved';
      }

      const plotType = row.TYPE ? `Type ${row.TYPE}` : 'Residential';
      const sizeSqM = Math.round(parseFloat(row['PLOT AREA IN SQMT']) || 0);
      const sizeSqFt = parseFloat(row['AREA SQFT.']) || 0;
      const facing = (row.facing || '').toString().trim() || 'N/A';
      
      const frontM = parseFloat(row.front) || 0;
      const depthM = parseFloat(row.depth) || 0;
      const frontFt = frontM * 3.28084;
      const depthFt = depthM * 3.28084;
      
      const areaText = (frontM && depthM) ? `${sizeSqFt.toFixed(2)} Sq ft (${frontFt.toFixed(2)} × ${depthFt.toFixed(2)})` : undefined;
      
      const { error } = await supabaseAdmin.from('plots').update({
        status,
        type: plotType,
        size_sqm: sizeSqM,
        size_sqft: Math.round(sizeSqFt),
        facing,
        area_text: areaText
      }).eq('id', dbPlot.id);

      if (error) {
        console.error(`Error updating plot ${label}:`, error.message);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`Plot ${label} from Excel not found in Database.`);
    }
  }

  console.log(`Successfully updated ${updatedCount} plots.`);
}

runSync();
