// app/hq/loading.tsx
// Shown by Next.js automatically while any /hq/* page's server component is fetching.
// Renders the full sidebar shell + shimmer content for dashboard, sites, and users pages.
export default function HQLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .hq-sk {
          background: linear-gradient(90deg, #1e293b 25%, #273549 50%, #1e293b 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      {/* Sidebar skeleton */}
      <div style={{ width: 260, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '0 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hq-sk" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
          <div className="hq-sk" style={{ width: 120, height: 16 }} />
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {[100, 90, 90].map((w, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="hq-sk" style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 4 }} />
              <div className="hq-sk" style={{ width: w, height: 13 }} />
            </div>
          ))}
        </div>

        {/* Sign out at bottom */}
        <div style={{ marginTop: 'auto', padding: '0 24px' }}>
          <div className="hq-sk" style={{ width: '100%', height: 38, borderRadius: 8 }} />
        </div>
      </div>

      {/* Main content skeleton */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {/* Page title */}
        <div className="hq-sk" style={{ width: 260, height: 28, marginBottom: 10 }} />
        <div className="hq-sk" style={{ width: 340, height: 15, marginBottom: 36 }} />

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
              <div className="hq-sk" style={{ width: 90, height: 13, marginBottom: 12 }} />
              <div className="hq-sk" style={{ width: 64, height: 38 }} />
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="hq-sk" style={{ width: 140, height: 18 }} />
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, padding: '12px 24px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
            {[140, 80, 80, 70].map((w, i) => (
              <div key={i} className="hq-sk" style={{ height: 12, width: w }} />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, padding: '18px 24px', borderBottom: i < 7 ? '1px solid #334155' : 'none', alignItems: 'center' }}>
              <div className="hq-sk" style={{ height: 14, width: '55%' }} />
              <div className="hq-sk" style={{ height: 22, width: 72, borderRadius: 4 }} />
              <div className="hq-sk" style={{ height: 14, width: '60%' }} />
              <div className="hq-sk" style={{ height: 14, width: '45%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
