/**
 * query-plots.mjs
 * Queries Supabase to list all bhaavbhumi plots by type, number and facing
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .map(l => l.split('='))
    .filter(p => p[0] && p[1])
    .map(p => [p[0].trim(), p.slice(1).join('=').trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: site } = await db.from('sites').select('id').eq('slug', 'bhaavbhumi').single();
if (!site) { console.error('bhaavbhumi site not found'); process.exit(1); }

const { data: plots } = await db
  .from('plots')
  .select('id,label,type,facing,number')
  .eq('site_id', site.id)
  .order('number');

const types = [...new Set(plots.map(p => p.type))].sort();
console.log('\n=== UNIQUE PLOT TYPES ===');
console.log(types.join('\n'));

for (const t of ['Type 3', 'Type 4', 'Type 6', 'Type3', 'Type4', 'Type6']) {
  const filtered = plots.filter(p => p.type?.toLowerCase() === t.toLowerCase());
  if (filtered.length === 0) continue;
  console.log(`\n=== ${t} (${filtered.length} plots) ===`);
  filtered.forEach(p => console.log(`  #${p.number}  ${p.label}  |  facing: ${p.facing}`));
}

// Also show C-labeled plots
const cPlots = plots.filter(p => /^C\d/.test(p.label?.trim()));
console.log(`\n=== C-labeled plots (${cPlots.length}) ===`);
cPlots.forEach(p => console.log(`  #${p.number}  ${p.label}  |  type: ${p.type}  |  facing: ${p.facing}`));
