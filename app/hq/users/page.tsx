import React from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export default async function HQUsers() {
  const { data: sites } = await supabaseAdmin.from('sites').select('id, name').order('name');
  
  // Fetch users from site_users and join with sites
  const { data: siteUsers } = await supabaseAdmin
    .from('site_users')
    .select('*, sites(name)')
    .order('created_at', { ascending: false });

  // Note: We can't easily join auth.users via foreign key in standard Supabase SQL without special grants,
  // so we'll just display the user_id for now or fetch auth users via admin API.
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

  const mappedUsers = siteUsers?.map(su => {
    const authUser = users.find(u => u.id === su.user_id);
    return {
      ...su,
      email: authUser?.email || 'Unknown',
      site_name: su.sites?.name || 'All Sites (Super Admin)'
    };
  });

  async function addUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const site_id = formData.get('site_id') as string;

    // 1. Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm so they can login immediately
    });

    if (authError || !authData.user) {
      console.error(authError);
      return;
    }

    // 2. Add to site_users
    await supabaseAdmin.from('site_users').insert({
      user_id: authData.user.id,
      role: role,
      site_id: role === 'super_admin' ? null : site_id
    });

    revalidatePath('/hq/users');
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 24 }}>Manage Admins</h1>

      <div style={{ background: '#1e293b', padding: 24, borderRadius: 16, border: '1px solid #334155', marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 16 }}>Add New Admin</h2>
        <form action={addUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Email</label>
            <input name="email" type="email" required placeholder="admin@site.com" style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Temporary Password</label>
            <input name="password" type="text" required placeholder="Min 6 chars" style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Role</label>
            <select name="role" required style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }}>
              <option value="site_admin">Site Admin (Restricted)</option>
              <option value="super_admin">Super Admin (Master)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Assign to Site</label>
            <select name="site_id" style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }}>
              <option value="">None (Super Admin only)</option>
              {sites?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ padding: '11px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Create Admin
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>Note: Super Admins have access to the HQ and all sites. Site Admins can only access the standard /admin panel for their assigned site.</p>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Role</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Assigned Site</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Added On</th>
            </tr>
          </thead>
          <tbody>
            {mappedUsers?.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px', fontSize: 15, fontWeight: 500 }}>{u.email}</td>
                <td style={{ padding: '16px', fontSize: 14 }}>
                  {u.role === 'super_admin' ? (
                    <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>SUPER ADMIN</span>
                  ) : (
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>SITE ADMIN</span>
                  )}
                </td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>{u.site_name}</td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
