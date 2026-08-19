import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const plotData = [
  { label: '1', area: 3228.00, status: 'available' },
  { label: '7', area: 3228.00, status: 'available' },
  { label: '8', area: 3228.00, status: 'reserved' }, // MORTGAGE
  { label: '11', area: 3228.00, status: 'reserved' }, // MORTGAGE
  { label: '31', area: 2475.15, status: 'reserved' }, // MORTGAGE
  { label: '32', area: 4680.60, status: 'reserved' }, // MORTGAGE
  { label: 'L1', area: 1075.96, status: 'available' },
  { label: 'L2', area: 1075.96, status: 'available' },
  { label: 'L3', area: 1075.96, status: 'available' },
  { label: '9', area: 23295.00, status: 'sold' } // empty status, assuming sold or just keeping area
];

async function syncLeft() {
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'suncity').single();
  if (!site) return console.log('Site suncity not found');
  
  const { data: dbPlots } = await supabaseAdmin.from('plots').select('id, label').eq('site_id', site.id);
  if (!dbPlots) return console.log('No DB plots found');
  
  const dbPlotMap = new Map();
  for (const p of dbPlots) {
    dbPlotMap.set(p.label.trim().toLowerCase(), p);
  }

  // First, mark all plots from 1 to 37 as 'sold' since only a few are available/mortgage
  const plots1To37 = Array.from({ length: 37 }, (_, i) => String(i + 1));
  let updatedCount = 0;

  for (const pLabel of plots1To37) {
    const dbPlot = dbPlotMap.get(pLabel);
    if (dbPlot) {
      await supabaseAdmin.from('plots').update({ status: 'sold', phase: 'N/A' }).eq('id', dbPlot.id);
    }
  }

  // Now update the specific ones with their area and real status
  for (const row of plotData) {
    const dbPlot = dbPlotMap.get(row.label.toLowerCase());
    if (dbPlot) {
      const { error } = await supabaseAdmin.from('plots').update({
        status: row.status,
        size_sqft: Math.round(row.area),
        area_text: `${row.area} Sq ft`,
        phase: 'N/A'
      }).eq('id', dbPlot.id);

      if (error) {
        console.error(`Error updating plot ${row.label}:`, error.message);
      } else {
        console.log(`Updated plot ${row.label} - ${row.status} - ${row.area} Sq ft`);
        updatedCount++;
      }
    } else {
      console.log(`Plot ${row.label} not found in DB`);
    }
  }
  
  console.log(`Successfully updated exact data for ${updatedCount} plots.`);
}

syncLeft();
