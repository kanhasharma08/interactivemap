import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: sites, error } = await supabaseAdmin.from('sites').select('id, name, slug');
  console.log('Sites:', sites);
  
  const site = sites?.find(s => s.slug.includes('suncity') || s.name.toLowerCase().includes('suncity'));
  if (site) {
    const { data: plots } = await supabaseAdmin.from('plots').select('id, label, number').eq('site_id', site.id).limit(10);
    console.log('Suncity plots:', plots);
  } else {
    console.log('Suncity site not found, finding all plots...');
    const { data: plots } = await supabaseAdmin.from('plots').select('id, label, number, site_id').limit(10);
    console.log('First 10 plots:', plots);
  }
}
check();
