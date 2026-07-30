'use client';

import React, { useState } from 'react';

export default function EditAdminButton({ 
  userId, 
  email, 
  currentRole, 
  currentSiteIds, 
  sites, 
  updateAction 
}: { 
  userId: string;
  email: string;
  currentRole: string;
  currentSiteIds: string[];
  sites: { id: string, name: string }[];
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(currentRole);
  // Keep track of selected sites locally for the UI state
  const [selectedSites, setSelectedSites] = useState<string[]>(currentSiteIds);

  const handleToggleSite = (siteId: string) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(selectedSites.filter(id => id !== siteId));
    } else {
      setSelectedSites([...selectedSites, siteId]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'rgba(59,130,246,0.1)',
          color: '#3b82f6',
          border: '1px solid rgba(59,130,246,0.3)',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          marginRight: '8px'
        }}
      >
        Edit
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1e293b',
            padding: 24,
            borderRadius: 16,
            border: '1px solid #334155',
            width: '100%',
            maxWidth: 400,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: 'white' }}>Edit Admin: {email}</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>&times;</button>
            </div>
            
            <form action={async (formData) => {
              formData.append('user_id', userId);
              await updateAction(formData);
              setIsOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Role</label>
                <select name="role" value={role} onChange={e => setRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', outline: 'none' }}>
                  <option value="site_admin">Site Admin (Restricted)</option>
                  <option value="super_admin">Super Admin (Full Access)</option>
                </select>
              </div>

              {role === 'site_admin' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 500 }}>
                    Assigned Sites (required for Site Admin)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {sites.map(s => (
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
                          checked={selectedSites.includes(s.id)}
                          onChange={() => handleToggleSite(s.id)}
                          style={{ width: 15, height: 15, accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={{
                  flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                }}>Save Changes</button>
                <button type="button" onClick={() => setIsOpen(false)} style={{
                  flex: 1, padding: '10px', background: 'transparent', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
