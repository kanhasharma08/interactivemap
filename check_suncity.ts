import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'suncity').single();
  if (site) {
    const { data: allPlots } = await supabaseAdmin.from('plots').select('label, area_text, size_sqft').eq('site_id', site.id);
    
    if (allPlots) {
      const missingData = allPlots.filter(p => !p.area_text);
      console.log(`Total plots in DB: ${allPlots.length}`);
      console.log(`Plots without synced data: ${missingData.length}`);
      const missingLabels = missingData.map(p => p.label).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      console.log('Labels missing data:', missingLabels.join(', '));
    }
  }
}
check();
