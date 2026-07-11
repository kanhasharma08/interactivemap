import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// DELETE /api/plots/[id] — delete a single plot by ID
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('plots')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DELETE /api/plots/[id]]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
