import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const imageStatusMap: Record<string, string> = {
  '1': 'available',
  '7': 'available',
  '8': 'reserved',
  '11': 'reserved',
  '31': 'reserved',
  '32': 'reserved',
  'l1': 'available',
  'l2': 'available',
  'l3': 'available',
  '9': 'available' // Assuming available since it's on the sheet
};

const westFacingSet = new Set(['l1', 'l2', 'l3']);
[[1, 8], [19, 26], [31, 37]].forEach(([start, end]) => {
  for (let i = start; i <= end; i++) westFacingSet.add(String(i));
});

function getArea(label: string): number | null {
  const num = parseInt(label);
  if (['l1', 'l2', 'l3'].includes(label)) return 1075.96;
  if (label === '9') return 23295.00;
  if (label === '10') return null;
  if (label === '31') return 2475.15;
  if (label === '32') return 4680.60;
  if (num >= 33 && num <= 37) return null;
  if (num >= 1 && num <= 30) return 3228.00;
  return null;
}

function getFacing(label: string): string {
  if (westFacingSet.has(label)) return 'West';
  return 'East';
}

function getStatus(label: string): string {
  if (imageStatusMap[label]) return imageStatusMap[label];
  return 'sold';
}

async function runSync() {
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('slug', 'suncity').single();
  if (!site) return console.log('Site suncity not found');
  
  const { data: dbPlots } = await supabaseAdmin.from('plots').select('id, label').eq('site_id', site.id);
  if (!dbPlots) return console.log('No DB plots found');
  
  const dbPlotMap = new Map();
  for (const p of dbPlots) {
    dbPlotMap.set(p.label.trim().toLowerCase(), p);
  }

  const targetLabels = [
    ...Array.from({ length: 37 }, (_, i) => String(i + 1)),
    'l1', 'l2', 'l3'
  ];

  let updatedCount = 0;

  for (const label of targetLabels) {
    const dbPlot = dbPlotMap.get(label);
    if (!dbPlot) {
      console.log(`Plot ${label} not found in DB`);
      continue;
    }

    const area = getArea(label);
    const facing = getFacing(label);
    const status = getStatus(label);

    const updatePayload: any = {
      status,
      facing,
      phase: 'N/A'
    };

    if (area !== null) {
      updatePayload.size_sqft = Math.round(area);
      updatePayload.area_text = `${area} Sq ft`;
    }

    const { error } = await supabaseAdmin.from('plots').update(updatePayload).eq('id', dbPlot.id);

    if (error) {
      console.error(`Error updating plot ${label}:`, error.message);
    } else {
      console.log(`Updated plot ${label} - Status: ${status}, Facing: ${facing}, Area: ${area ?? 'Unknown'}`);
      updatedCount++;
    }
  }

  console.log(`Successfully synced ${updatedCount} left plots.`);
}

runSync();
