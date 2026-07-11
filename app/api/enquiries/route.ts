import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get('site');
    const siteId = await getSiteId(siteSlug);

    if (!siteId) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('*')
      .eq('site_id', siteId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[GET /api/enquiries]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
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

    const body = await request.json();
    body.site_id = siteId;

    const { error } = await supabaseAdmin
      .from('enquiries')
      .upsert(body, { onConflict: 'id' });

    if (error) {
      console.error('[POST /api/enquiries]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
