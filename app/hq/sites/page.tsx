import React from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export default async function HQSites() {
  const { data: sites } = await supabaseAdmin.from('sites').select('*').order('created_at', { ascending: false });

  async function addSite(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const width = parseInt(formData.get('width') as string) || 4762;
    const height = parseInt(formData.get('height') as string) || 6735;
    
    await supabaseAdmin.from('sites').insert({
      name, slug, svg_width: width, svg_height: height
    });
    
    revalidatePath('/hq/sites');
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 24 }}>Manage Sites</h1>

      <div style={{ background: '#1e293b', padding: 24, borderRadius: 16, border: '1px solid #334155', marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 16 }}>Add New Site</h2>
        <form action={addSite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Site Name</label>
            <input name="name" required placeholder="e.g. BhaavBhumi" style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Subdomain Slug</label>
            <input name="slug" required placeholder="e.g. bhaavbhumi" style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Map SVG Width</label>
            <input name="width" type="number" defaultValue={4762} style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Map SVG Height</label>
            <input name="height" type="number" defaultValue={6735} style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white' }} />
          </div>
          <button type="submit" style={{ padding: '11px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Create Site
          </button>
        </form>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Site Name</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Slug</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Dimensions</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, fontSize: 14 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sites?.map(site => (
              <tr key={site.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px', fontSize: 15, fontWeight: 500 }}>{site.name}</td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>
                  <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: 4 }}>{site.slug}</span>
                </td>
                <td style={{ padding: '16px', fontSize: 14, color: '#94a3b8' }}>{site.svg_width} x {site.svg_height}</td>
                <td style={{ padding: '16px' }}>
                  {site.is_active ? 
                    <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} /> Active</span> : 
                    <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Inactive</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
