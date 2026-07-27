/**
 * add-hero-images-column.mjs
 * 
 * Adds the hero_images column to the plots table via Supabase REST (pg_meta API).
 * Run once: node scripts/add-hero-images-column.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .map(l => l.split('='))
    .filter(p => p[0] && p[1])
    .map(p => [p[0].trim(), p.slice(1).join('=').trim()])
);

// Supabase pg_meta endpoint — lets you run DDL with the service role key
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const res = await fetch(`${baseUrl}/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'ALTER TABLE plots ADD COLUMN IF NOT EXISTS hero_images text[] DEFAULT ARRAY[]::text[];' })
});

// Alternative: use the query endpoint
const res2 = await fetch(`${baseUrl}/pg/query`, {
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'ALTER TABLE plots ADD COLUMN IF NOT EXISTS hero_images text[] DEFAULT ARRAY[]::text[];' })
});

console.log('pg/query status:', res2.status);
const body2 = await res2.text();
console.log('Response:', body2.substring(0, 200));
