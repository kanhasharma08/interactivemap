'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/context';
import { Plot, PlotStatus, Enquiry } from '@/types';
import { formatPrice } from '@/data/plots';
import AdminMapper from '@/components/AdminMapper';
import Link from 'next/link';

import { logout } from './actions';

// ── AdminDashboard Props ──────────────────────────────────────────────────
interface AdminDashboardProps {
  userEmail?: string;
  accessibleSites: Array<{ id: string, name: string, slug: string }>;
}

// ── Plot Management ──────────────────────────────────────────────────────────
function PlotManagement() {
  const { plots, updatePlot, addPlot, deletePlot, deleteAllPlots, siteSlug, isLoading } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mappingId, setMappingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Plot>>({});
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<PlotStatus | 'all'>('all');

  const filtered = plots.filter(p => {
    const q = searchQ.toLowerCase();
    const matchSearch = !searchQ || p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const startEdit = (plot: Plot) => {
    setEditingId(plot.id);
    setEditData({
      label: plot.label,
      status: plot.status,
      price: plot.price,
      sizeSqFt: plot.sizeSqFt,
      areaText: plot.areaText || '',
      facing: plot.facing,
      type: plot.type,
      phase: plot.phase,
    });
  };

  const saveEdit = (plotId: string) => {
    const updates: Partial<Plot> = { ...editData };
    if (updates.label) {
      updates.number = parseInt(updates.label.replace(/\D/g, '')) || 0;
    }
    if (updates.sizeSqFt) {
      updates.sizeSqM = Math.round(updates.sizeSqFt / 10.7639);
    }
    updatePlot(plotId, updates);
    setEditingId(null);
  };

  const statusCounts = {
    available: plots.filter(p => p.status === 'available').length,
    sold: plots.filter(p => p.status === 'sold').length,
    reserved: plots.filter(p => p.status === 'reserved').length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        {isLoading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="skeleton skeleton-stat" />
          ))
        ) : (
          [
            { label: 'Total Plots', value: plots.length, color: '#1e40af', bg: '#eff6ff', icon: '📊' },
            { label: 'Available', value: statusCounts.available, color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
            { label: 'Sold', value: statusCounts.sold, color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
            { label: 'Reserved', value: statusCounts.reserved, color: '#ea580c', bg: '#fff7ed', icon: '🟡' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 14, padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -6, right: -6, width: 40, height: 40, borderRadius: '50%', background: `${s.color}08`, pointerEvents: 'none' }} />
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: s.color, marginBottom: 4 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
            </div>
          ))
        )}
      </div>

      {mappingId && (
        <AdminMapper plotId={mappingId} onCancel={() => setMappingId(null)} onSave={() => setMappingId(null)} />
      )}

      {/* Filters */}
      <div className="admin-filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" placeholder="Search by plot label (e.g. B-1, A-15)..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as PlotStatus | 'all')}>
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="reserved">Reserved</option>
        </select>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Showing {filtered.length} of {plots.length} plots
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
            onClick={() => { if (plots.length > 0 && window.confirm('WARNING: Delete ALL plots? This cannot be undone.')) deleteAllPlots(siteSlug); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete All
          </button>
          <button className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={() => { const newId = addPlot(siteSlug); setMappingId(newId); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add New Plot
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plot Label</th>
              <th>Type</th>
              <th>Phase</th>
              <th>Plot Size (Area)</th>
              <th>Facing</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(plot => (
              <tr key={plot.id}>
                {/* Label */}
                <td>
                  {editingId === plot.id ? (
                    <input type="text" className="form-input" style={{ fontSize: 13, padding: '4px 8px', width: 90, fontWeight: 700 }}
                      value={editData.label ?? plot.label} onChange={e => setEditData(d => ({ ...d, label: e.target.value }))} />
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: plot.type === 'Premium' ? '#eab308' : plot.type === 'Mortgage' ? '#ef4444' : '#3b82f6', flexShrink: 0 }} />
                      {plot.label}
                    </span>
                  )}
                </td>
                {/* Type */}
                <td>
                  {editingId === plot.id ? (
                    <select className="form-select" style={{ fontSize: 12, padding: '4px 8px', width: 110 }}
                      value={editData.type || plot.type} onChange={e => setEditData(d => ({ ...d, type: e.target.value as Plot['type'] }))}>
                      <option value="Residential">Residential</option>
                      <option value="Premium">Premium</option>
                      <option value="Mortgage">Mortgage</option>
                      <option value="Amenity">Amenity</option>
                      <option value="N/A">N/A</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: plot.type === 'Premium' ? 'rgba(234,179,8,0.1)' : plot.type === 'Mortgage' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', color: plot.type === 'Premium' ? '#b45309' : plot.type === 'Mortgage' ? '#dc2626' : '#1e40af' }}>
                      {plot.type}
                    </span>
                  )}
                </td>
                {/* Phase */}
                <td>
                  {editingId === plot.id ? (
                    <select className="form-select" style={{ fontSize: 12, padding: '4px 8px', width: 65 }}
                      value={editData.phase || plot.phase}
                      onChange={e => setEditData(d => ({ ...d, phase: e.target.value === 'N/A' ? 'N/A' : Number(e.target.value) as 12 | 13 }))}>
                      <option value={12}>12</option>
                      <option value={13}>13</option>
                      <option value="N/A">N/A</option>
                    </select>
                  ) : plot.phase === 'N/A' ? 'N/A' : `Phase ${plot.phase}`}
                </td>
                {/* Plot Size (Area) - free text */}
                <td>
                  {editingId === plot.id ? (
                    <input type="text" className="form-input"
                      style={{ fontSize: 12, padding: '4px 8px', width: 130 }}
                      placeholder="e.g. 30×50 ft, 200 sq.yd"
                      value={editData.areaText ?? (plot.areaText || '')}
                      onChange={e => setEditData(d => ({ ...d, areaText: e.target.value }))} />
                  ) : (
                    <span style={{ fontSize: 12 }}>
                      {plot.areaText || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                    </span>
                  )}
                </td>
                {/* Facing */}
                <td>
                  {editingId === plot.id ? (
                    <select className="form-select" style={{ fontSize: 12, padding: '4px 8px' }}
                      value={editData.facing || plot.facing} onChange={e => setEditData(d => ({ ...d, facing: e.target.value as Plot['facing'] }))}>
                      {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', 'N/A'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  ) : plot.facing}
                </td>
                {/* Status */}
                <td>
                  {editingId === plot.id ? (
                    <select className="form-select" style={{ fontSize: 12, padding: '4px 8px' }}
                      value={editData.status || plot.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value as PlotStatus }))}>
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                      <option value="N/A">N/A</option>
                    </select>
                  ) : <span className={`status-badge ${plot.status}`}>{plot.status}</span>}
                </td>
                {/* Actions */}
                <td>
                  {editingId === plot.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => saveEdit(plot.id)}>Save</button>
                      <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => startEdit(plot)}>Edit</button>
                      <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setMappingId(plot.id)}>Remap</button>
                      <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 11, color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
                        onClick={() => { if (window.confirm(`Delete plot ${plot.label}?`)) deletePlot(plot.id); }}>
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No plots found</div>
        )}
      </div>
    </div>
  );
}

// ── Enquiry List ─────────────────────────────────────────────────────────────
function EnquiryList() {
  const { enquiries } = useApp();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (enquiries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Enquiries Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Enquiries submitted through the map will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {enquiries.length} enquir{enquiries.length === 1 ? 'y' : 'ies'} received
        </span>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Phone</th><th>Email</th>
              <th>Plot Interested</th><th>Source</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((enq: Enquiry, i: number) => (
              <tr key={enq.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{enq.name}</td>
                <td><a href={`tel:${enq.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>{enq.phone}</a></td>
                <td style={{ color: 'var(--text-muted)' }}>{enq.email || '—'}</td>
                <td><span style={{ fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)' }}>{enq.plotLabel}</span></td>
                <td><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-primary)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{enq.source}</span></td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(enq.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Site Switcher Dropdown ───────────────────────────────────────────────────
function SiteSwitcher({ accessibleSites, currentSlug }: { accessibleSites: Array<{ id: string; name: string; slug: string }>; currentSlug: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentSite = accessibleSites.find(s => s.slug === currentSlug) || accessibleSites[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigateToSite = (slug: string) => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isVercel = hostname.endsWith('.vercel.app') || hostname.endsWith('.now.sh');

    if (isLocalhost || isVercel) {
      // On dev/preview: set the cookie and reload
      document.cookie = `testSiteSlug=${slug}; path=/; max-age=86400`;
      window.location.reload();
    } else {
      // On production: navigate to the real subdomain
      const parts = hostname.split('.');
      const baseDomain = parts.slice(1).join('.'); // e.g. mahavirgroupindia.com
      window.location.href = `${window.location.protocol}//${slug}.${baseDomain}/admin`;
    }
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
          color: 'white', padding: '5px 10px', borderRadius: 7, fontSize: 12,
          fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          transition: 'background 0.15s',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
        {currentSite?.name || currentSlug}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 180,
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Switch Site
            </div>
            {accessibleSites.map(site => (
              <button
                key={site.id}
                onClick={() => navigateToSite(site.slug)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px',
                  background: site.slug === currentSlug ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: 'none', color: site.slug === currentSlug ? '#60a5fa' : '#e2e8f0',
                  fontSize: 13, fontWeight: site.slug === currentSlug ? 600 : 400,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {site.slug === currentSlug && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#60a5fa" stroke="none">
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
                )}
                {site.slug !== currentSlug && <span style={{ width: 10 }} />}
                {site.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Admin Dashboard ──────────────────────────────────────────────────────────
type AdminTab = 'plots' | 'enquiries';

export default function AdminDashboard({ userEmail, accessibleSites }: AdminDashboardProps) {
  const { siteSlug } = useApp();
  const [tab, setTab] = useState<AdminTab>('plots');

  // Allow scrolling on the admin page (globals.css sets overflow:hidden for the map)
  React.useEffect(() => {
    const html = document.documentElement;
    // Restore scroll + touch capabilities that the map page may have locked
    html.style.overflow = 'auto';
    html.style.touchAction = 'auto';
    html.style.overscrollBehavior = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.touchAction = 'auto';
    html.style.height = 'auto';
    document.body.style.height = 'auto';
    return () => {
      html.style.overflow = '';
      html.style.touchAction = '';
      html.style.overscrollBehavior = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      html.style.height = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', fontFamily: "'Inter', sans-serif", background: 'var(--bg-primary)', overflowY: 'auto', touchAction: 'auto' }}>
      {/* Top bar */}
      <div className="admin-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Site Admin Panel</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{userEmail}</div>
          </div>
          {/* Site switcher — only shown when admin has access to multiple sites */}
          {accessibleSites.length > 1 && (
            <SiteSwitcher accessibleSites={accessibleSites} currentSlug={siteSlug} />
          )}
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['plots', 'enquiries'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", background: tab === t ? '#1e40af' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {t === 'plots' ? 'Plots' : 'Enquiries'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <Link href="/" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap', display: 'inline-block' }}>
            ← Map
          </Link>
          <form action={logout}>
            <button type="submit" style={{ fontSize: 11, color: 'rgba(239,68,68,0.8)', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '20px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>
            {tab === 'plots' ? 'Plot Management' : 'Enquiries'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {tab === 'plots' ? 'View and update plot details, pricing, and availability status.' : 'Customer enquiries submitted through the interactive map.'}
          </p>
        </div>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'plots' ? <PlotManagement /> : <EnquiryList />}
        </motion.div>
      </div>
    </div>
  );
}
