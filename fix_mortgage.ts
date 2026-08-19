import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixMortgage() {
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'suncity').single();
  if (!site) return console.log('Site suncity not found');
  
  const { data: dbPlots } = await supabaseAdmin.from('plots').select('id, label, status').eq('site_id', site.id);
  if (!dbPlots) return console.log('No DB plots found');
  
  let updatedCount = 0;

  for (const plot of dbPlots) {
    if (plot.status === 'reserved') {
      const { error } = await supabaseAdmin.from('plots').update({
        type: 'Mortgage'
      }).eq('id', plot.id);

      if (error) {
        console.error(`Error updating plot ${plot.label}:`, error.message);
      } else {
        console.log(`Updated plot ${plot.label} to Mortgage type`);
        updatedCount++;
      }
    }
  }

  console.log(`Successfully fixed type for ${updatedCount} reserved/mortgage plots.`);
}

fixMortgage();
