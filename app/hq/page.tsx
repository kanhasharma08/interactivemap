import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export default async function HQDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch totals across all sites
  const { count: totalSites } = await supabaseAdmin.from('sites').select('*', { count: 'exact', head: true });
  const { count: totalAdmins } = await supabaseAdmin.from('site_users').select('*', { count: 'exact', head: true }).eq('role', 'site_admin');
  const { count: totalPlots } = await supabaseAdmin.from('plots').select('*', { count: 'exact', head: true });
  const { count: totalEnquiries } = await supabaseAdmin.from('enquiries').select('*', { count: 'exact', head: true });

  const { data: recentSites } = await supabaseAdmin
    .from('sites')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Welcome back, Super Admin</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>Here is the global overview of your real estate empire.</p>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'Active Sites', value: totalSites || 0, color: '#3b82f6' },
          { label: 'Total Plots', value: totalPlots || 0, color: '#8b5cf6' },
          { label: 'Total Enquiries', value: totalEnquiries || 0, color: '#f59e0b' },
          { label: 'Site Admins', value: totalAdmins || 0, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: stat.color, fontFamily: "'Outfit', sans-serif" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 20 }}>Recent Sites</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>Site Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>Subdomain</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {recentSites?.map(site => (
              <tr key={site.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px', fontSize: 15, fontWeight: 500 }}>{site.name}</td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>{site.slug}.mahavirgroup.com</td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>{new Date(site.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!recentSites?.length && (
              <tr>
                <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No sites found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
