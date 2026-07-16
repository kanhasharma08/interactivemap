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
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'bhaavbhumi').single();
  if (site) {
    const { data: plots } = await supabaseAdmin.from('plots').select('*').eq('site_id', site.id).limit(2);
    console.log('Bhaavbhumi plots sizes:', plots);
  }
}
check();
