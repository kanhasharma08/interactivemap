import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Plot, PlotStatus } from '@/types';

// Helper to get site_id from slug
async function getSiteId(slug: string | null) {
  if (!slug) return null;
  const { data } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id || null;
}

// Transform functions to match DB column names (snake_case)
function mapPlot(plot: Plot) {
  return {
    id: plot.id,
    number: plot.number,
    label: plot.label,
    x: plot.x,
    y: plot.y,
    width: plot.width,
    height: plot.height,
    size_sqft: plot.sizeSqFt,
    size_sqm: plot.sizeSqM,
    facing: plot.facing,
    phase: plot.phase,
    price: plot.price,
    status: plot.status,
    type: plot.type,
    area_text: plot.areaText,
    site_id: (plot as any).site_id,
  };
}

function mapRow(row: any): Plot {
  return {
    id: row.id,
    number: row.number,
    label: row.label,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    sizeSqFt: row.size_sqft,
    sizeSqM: row.size_sqm,
    facing: row.facing,
    phase: row.phase,
    price: row.price,
    status: row.status as PlotStatus,
    type: row.type,
    areaText: row.area_text,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get('site');
    const siteId = await getSiteId(siteSlug);

    if (!siteId) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('plots')
      .select('*')
      .eq('site_id', siteId)
      .order('number', { ascending: true });

    if (error) {
      console.error('[GET /api/plots]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(mapRow));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get('site');
    const siteId = await getSiteId(siteSlug);

    if (!siteId) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const plot = await request.json();
    (plot as any).site_id = siteId;

    const { error } = await supabaseAdmin
      .from('plots')
      .upsert(mapPlot(plot), { onConflict: 'id' });

    if (error) {
      console.error('[POST /api/plots]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get('site');
    const siteId = await getSiteId(siteSlug);

    if (!siteId) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('plots')
      .delete()
      .eq('site_id', siteId)
      .neq('id', 'prevent-empty-delete');

    if (error) {
      console.error('[DELETE /api/plots]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
