import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { logout } from '../admin/actions';

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  // ── Auth Guard ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin');
  }

  // Must be super_admin to access HQ
  const { data: superAdmin } = await supabaseAdmin
    .from('site_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'super_admin')
    .single();

  if (!superAdmin) {
    redirect('/admin');
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px', marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            Super Admin HQ
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          <Link href="/hq" style={{ padding: '10px 12px', borderRadius: 8, color: '#e2e8f0', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </Link>
          <Link href="/hq/sites" style={{ padding: '10px 12px', borderRadius: 8, color: '#e2e8f0', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Manage Sites
          </Link>
          <Link href="/hq/users" style={{ padding: '10px 12px', borderRadius: 8, color: '#e2e8f0', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Manage Admins
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 24px' }}>
          <form action={logout}>
            <button type="submit" style={{ width: '100%', padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
