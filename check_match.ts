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

async function check() {
  const workbook = xlsx.readFile('BB PLOT SIZE.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet) as any[];

  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'bhaavbhumi').single();
  if (!site) return console.log('Site not found');
  
  const { data: plots } = await supabaseAdmin.from('plots').select('id, label, number').eq('site_id', site.id);
  
  const dbLabels = new Set(plots?.map(p => p.label.toUpperCase().replace(/\s/g, '')) || []);
  const excelLabels = new Set();
  
  let matchCount = 0;
  let missingInDb = [];
  
  for (const row of data) {
    if (!row.BLOCK || !row['NO.']) continue;
    const label = `${row.BLOCK}${row['NO.']}`.toUpperCase().replace(/\s/g, '');
    excelLabels.add(label);
    
    if (dbLabels.has(label)) {
      matchCount++;
    } else {
      missingInDb.push(label);
    }
  }

  const missingInExcel = [...dbLabels].filter(l => !excelLabels.has(l));

  console.log(`Total Excel Rows: ${data.length}`);
  console.log(`Total DB Plots: ${plots?.length}`);
  console.log(`Matches: ${matchCount}`);
  console.log(`Missing in DB (found in Excel):`, missingInDb.slice(0, 10), missingInDb.length > 10 ? '...' : '');
  console.log(`Missing in Excel (found in DB):`, missingInExcel.slice(0, 10), missingInExcel.length > 10 ? '...' : '');
}

check();
