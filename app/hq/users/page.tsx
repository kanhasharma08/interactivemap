import React from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import DeleteAdminButton from './DeleteAdminButton';

export default async function HQUsers() {
  const { data: sites } = await supabaseAdmin.from('sites').select('id, name').order('name');

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
    const siteObj = Array.isArray(su.sites) ? su.sites[0] : su.sites;
    const siteName = su.role === 'super_admin'
      ? 'All Sites (Super Admin)'
      : (siteObj as any)?.name || '—';

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
        site_names: [siteName],
      });
    }
  }

  const mappedUsers = Array.from(userMap.values());

  async function addUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    // Checkboxes: each checked site sends a value under 'site_ids'
    const selectedSiteIds = formData.getAll('site_ids') as string[];

    // Validate: site_admin must have at least one site
    if (role === 'site_admin' && selectedSiteIds.length === 0) {
      redirect('/hq/users?error=no_sites');
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so they can login immediately
    });

    if (authError || !authData.user) {
      console.error('Auth create error:', authError?.message);
      redirect(`/hq/users?error=${encodeURIComponent(authError?.message || 'create_failed')}`);
    }

    const newUserId = authData.user!.id;

    // Step 2: Insert into site_users
    let insertError = null;
    if (role === 'super_admin') {
      const { error } = await supabaseAdmin.from('site_users').insert({
        user_id: newUserId, role: 'super_admin', site_id: null
      });
      insertError = error;
    } else {
      const rows = selectedSiteIds.map(site_id => ({ user_id: newUserId, role: 'site_admin', site_id }));
      const { error } = await supabaseAdmin.from('site_users').insert(rows);
      insertError = error;
    }

    if (insertError) {
      // Cleanup: remove the auth user so we don't leave orphans
      console.error('site_users insert error:', insertError.message);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      redirect(`/hq/users?error=${encodeURIComponent(insertError.message)}`);
    }

    revalidatePath('/hq/users');
    redirect('/hq/users?success=1');
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
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 20 }}>Add New Admin</h2>
        <form action={addUser} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Row 1 — credentials + role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input name="email" type="email" required placeholder="admin@example.com"
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Temporary Password</label>
              <input name="password" type="text" required placeholder="Min 6 characters"
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Role</label>
              <select name="role" required
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', boxSizing: 'border-box', outline: 'none' }}>
                <option value="site_admin">Site Admin (Restricted)</option>
                <option value="super_admin">Super Admin (Full Access)</option>
              </select>
            </div>
          </div>

          {/* Row 2 — site checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 500 }}>
              Assign to Sites <span style={{ color: '#475569', fontWeight: 400 }}>(required for Site Admin — tick one or more)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {sites?.map(s => (
                <label key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                  padding: '8px 14px', fontSize: 13, color: '#e2e8f0', fontWeight: 500,
                  userSelect: 'none',
                }}>
                  <input
                    type="checkbox"
                    name="site_ids"
                    value={s.id}
                    style={{ width: 15, height: 15, accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 8, margin: '8px 0 0' }}>
              Leave unticked only if creating a Super Admin. Site Admins must have at least one site.
            </p>
          </div>

          <div>
            <button type="submit" style={{
              padding: '11px 28px', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              fontSize: 14, fontFamily: "'Inter', sans-serif",
            }}>
              Create Admin
            </button>
          </div>
        </form>
      </div>

      {/* ── Admin Table ────────────────────────────────────────── */}
      <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 13 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 13 }}>Role</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 13 }}>Assigned Sites</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 13 }}>Added On</th>
              <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappedUsers.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{u.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  {u.role === 'super_admin' ? (
                    <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>SUPER ADMIN</span>
                  ) : (
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>SITE ADMIN</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {u.site_names.map((name, i) => (
                      <span key={i} style={{
                        background: u.role === 'super_admin' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                        color: u.role === 'super_admin' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${u.role === 'super_admin' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <DeleteAdminButton userId={u.user_id} email={u.email} deleteAction={deleteUser} />
                </td>
              </tr>
            ))}
            {mappedUsers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                  No admins yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
