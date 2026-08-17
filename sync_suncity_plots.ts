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
  console.log('Reading datas.xlsx...');
  const workbook = xlsx.readFile('datas/datas.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet) as any[];
  console.log(`Found ${data.length} rows in Excel.`);

  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'suncity').single();
  if (!site) {
    console.log('Site suncity not found');
    return;
  }
  
  const { data: dbPlots } = await supabaseAdmin.from('plots').select('*').eq('site_id', site.id);
  if (!dbPlots) {
    console.log('No DB plots found for suncity');
    return;
  }
  
  const dbPlotMap = new Map();
  for (const p of dbPlots) {
    // Match exactly ignoring case and surrounding spaces
    dbPlotMap.set(p.label.trim().toLowerCase(), p);
  }

  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const row of data) {
    const excelPlotNumber = String(row['Plot Number'] || '').trim().toLowerCase();
    if (!excelPlotNumber) continue;
    
    const dbPlot = dbPlotMap.get(excelPlotNumber);
    
    if (dbPlot) {
      let status = 'available';
      const excelStatus = String(row.Status || '').trim().toLowerCase();
      if (excelStatus === 'sold' || excelStatus === 'booked') {
        status = 'sold';
      } else if (excelStatus === 'reserved' || excelStatus === 'mortgage') {
        status = 'reserved';
      }

      const plotType = row.Type ? String(row.Type).trim() : 'Residential';
      const exactArea = parseFloat(row.Area) || 0;
      const sizeSqFt = Math.round(exactArea);
      const facing = String(row.Facing || '').trim() || 'N/A';
      const areaText = `${exactArea} Sq ft`;
      
      const { error } = await supabaseAdmin.from('plots').update({
        status,
        type: plotType,
        size_sqft: sizeSqFt,
        area_text: areaText,
        facing,
        phase: 'N/A'
      }).eq('id', dbPlot.id);

      if (error) {
        console.error(`Error updating plot ${row['Plot Number']}:`, error.message);
      } else {
        updatedCount++;
      }
    } else {
      notFoundCount++;
      // console.log(`Plot ${row['Plot Number']} from Excel not found in Database.`);
    }
  }

  console.log(`Successfully updated ${updatedCount} plots.`);
  console.log(`${notFoundCount} plots from Excel were not found in Database.`);
}

runSync();
