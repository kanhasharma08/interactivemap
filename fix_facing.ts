import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixFacing() {
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'suncity').single();
  if (!site) {
    console.log('Site suncity not found');
    return;
  }
  
  const { data: dbPlots } = await supabaseAdmin.from('plots').select('id, label').eq('site_id', site.id);
  if (!dbPlots) {
    console.log('No DB plots found');
    return;
  }
  
  const westFacing = new Set([
    ...Array.from({ length: 92 - 87 + 1 }, (_, i) => `D${87 + i}`), // D87 to D92
    ...Array.from({ length: 109 - 101 + 1 }, (_, i) => `D${101 + i}`), // D101 to D109
    ...Array.from({ length: 127 - 119 + 1 }, (_, i) => `D${119 + i}`)  // D119 to D127
  ].map(p => p.toLowerCase()));

  const eastFacing = new Set([
    ...Array.from({ length: 100 - 93 + 1 }, (_, i) => `D${93 + i}`), // D93 to D100
    ...Array.from({ length: 118 - 110 + 1 }, (_, i) => `D${110 + i}`), // D110 to D118
    ...Array.from({ length: 66 - 57 + 1 }, (_, i) => `B${57 + i}`)   // B57 to B66
  ].map(p => p.toLowerCase()));

  let updatedCount = 0;

  for (const plot of dbPlots) {
    const labelLower = plot.label.toLowerCase().trim();
    let facingToUpdate = null;

    if (westFacing.has(labelLower)) {
      facingToUpdate = 'West';
    } else if (eastFacing.has(labelLower)) {
      facingToUpdate = 'East';
    }

    if (facingToUpdate) {
      const { error } = await supabaseAdmin.from('plots').update({
        facing: facingToUpdate
      }).eq('id', plot.id);

      if (error) {
        console.error(`Error updating plot ${plot.label}:`, error.message);
      } else {
        console.log(`Updated plot ${plot.label} to facing ${facingToUpdate}`);
        updatedCount++;
      }
    }
  }

  console.log(`Successfully fixed facing for ${updatedCount} plots.`);
}

fixFacing();
