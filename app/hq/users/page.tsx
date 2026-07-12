import React from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export default async function HQUsers() {
  const { data: sites } = await supabaseAdmin.from('sites').select('id, name').order('name');

  // Fetch all site_users rows joined with sites
  const { data: siteUsers } = await supabaseAdmin
    .from('site_users')
    .select('*, sites(id, name)')
    .order('created_at', { ascending: false });

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

  // Group site_users rows by user_id so multi-site admins appear as one row
  const userMap = new Map<string, {
    user_id: string;
    role: string;
    email: string;
    created_at: string;
    site_names: string[];
  }>();

  for (const su of siteUsers || []) {
    const authUser = users.find(u => u.id === su.user_id);
    const email = authUser?.email || 'Unknown';
    const siteName = su.role === 'super_admin'
      ? 'All Sites (Super Admin)'
      : (Array.isArray(su.sites) ? su.sites[0]?.name : (su.sites as any)?.name) || '—';

    if (userMap.has(su.user_id)) {
      const existing = userMap.get(su.user_id)!;
      if (su.role !== 'super_admin' && !existing.site_names.includes(siteName)) {
        existing.site_names.push(siteName);
      }
    } else {
      userMap.set(su.user_id, {
        user_id: su.user_id,
        role: su.role,
        email,
        created_at: su.created_at,
        site_names: su.role === 'super_admin' ? ['All Sites (Super Admin)'] : [siteName],
      });
    }
  }

  const mappedUsers = Array.from(userMap.values());

  async function addUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    // getAll returns an array for multi-select fields
    const selectedSiteIds = formData.getAll('site_ids') as string[];

    // 1. Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Auth create error:', authError);
      return;
    }

    const newUserId = authData.user.id;

    if (role === 'super_admin') {
      // Super admins get a single row with no site
      await supabaseAdmin.from('site_users').insert({ user_id: newUserId, role: 'super_admin', site_id: null });
    } else {
      // Site admins get one row per selected site
      if (selectedSiteIds.length === 0) {
        console.error('No sites selected for site_admin');
        return;
      }
      const rows = selectedSiteIds.map(site_id => ({ user_id: newUserId, role: 'site_admin', site_id }));
      await supabaseAdmin.from('site_users').insert(rows);
    }

    revalidatePath('/hq/users');
  }

  async function deleteUser(formData: FormData) {
    'use server';
    const userId = formData.get('user_id') as string;
    if (!userId) return;

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) console.error('Auth delete error:', authError);

    await supabaseAdmin.from('site_users').delete().eq('user_id', userId);
    revalidatePath('/hq/users');
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 24 }}>Manage Admins</h1>

      {/* ── Add Admin Form ─────────────────────────────────────── */}
      <div style={{ background: '#1e293b', padding: 24, borderRadius: 16, border: '1px solid #334155', marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 16 }}>Add New Admin</h2>
        <form action={addUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Email</label>
              <input name="email" type="email" required placeholder="admin@site.com"
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Temporary Password</label>
              <input name="password" type="text" required placeholder="Min 6 chars"
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Role</label>
              <select name="role" required
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', boxSizing: 'border-box' }}>
                <option value="site_admin">Site Admin (Restricted)</option>
                <option value="super_admin">Super Admin (Master)</option>
              </select>
            </div>
          </div>

          {/* Multi-select site assignment */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Assign to Sites <span style={{ color: '#64748b' }}>(Hold Ctrl / Cmd to select multiple — leave blank for Super Admin)</span>
            </label>
            <select name="site_ids" multiple
              style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', minHeight: 100, boxSizing: 'border-box' }}>
              {sites?.map(s => (
                <option key={s.id} value={s.id} style={{ padding: '6px 8px' }}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" style={{ padding: '11px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Create Admin
            </button>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              Super Admins get access to HQ and all sites. Site Admins can only access their assigned site(s) via /admin.
            </p>
          </div>
        </form>
      </div>

      {/* ── Admin Table ────────────────────────────────────────── */}
      <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Role</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Assigned Sites</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Added On</th>
              <th style={{ textAlign: 'right', padding: '16px', fontWeight: 600, fontSize: 14 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappedUsers.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px', fontSize: 15, fontWeight: 500 }}>{u.email}</td>
                <td style={{ padding: '16px', fontSize: 14 }}>
                  {u.role === 'super_admin' ? (
                    <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>SUPER ADMIN</span>
                  ) : (
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>SITE ADMIN</span>
                  )}
                </td>
                <td style={{ padding: '16px', fontSize: 13, color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {u.site_names.map((name, i) => (
                      <span key={i} style={{
                        background: u.role === 'super_admin' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                        color: u.role === 'super_admin' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${u.role === 'super_admin' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <form action={deleteUser}>
                    <input type="hidden" name="user_id" value={u.user_id} />
                    <button type="submit"
                      onClick={(e) => { if (!window.confirm(`Delete admin ${u.email}?`)) e.preventDefault(); }}
                      style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {mappedUsers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No admins found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
