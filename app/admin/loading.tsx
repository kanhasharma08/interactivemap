// app/admin/loading.tsx
// Shown by Next.js automatically while the admin server component is fetching data.
export default function AdminLoading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      fontFamily: "'Inter', sans-serif", background: '#f8fafc',
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      {/* Top bar */}
      <div style={{ height: 52, background: '#1e40af', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <div className="sk" style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
        <div className="sk" style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ flex: 1 }} />
        <div className="sk" style={{ width: 80, height: 26, background: 'rgba(255,255,255,0.12)', borderRadius: 8 }} />
        <div className="sk" style={{ width: 64, height: 26, background: 'rgba(255,255,255,0.12)', borderRadius: 8 }} />
        <div className="sk" style={{ width: 72, height: 26, background: 'rgba(255,255,255,0.12)', borderRadius: 8 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px' }}>
        {/* Page title */}
        <div style={{ marginBottom: 16 }}>
          <div className="sk" style={{ width: 180, height: 22, marginBottom: 8 }} />
          <div className="sk" style={{ width: 300, height: 13 }} />
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: 'white', borderRadius: 14, padding: '18px 22px', border: '1px solid #e2e8f0' }}>
              <div className="sk" style={{ width: 70, height: 11, marginBottom: 10 }} />
              <div className="sk" style={{ width: 50, height: 32 }} />
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <div className="sk" style={{ width: 280, height: 36, borderRadius: 8 }} />
          <div className="sk" style={{ width: 140, height: 36, borderRadius: 8 }} />
          <div style={{ flex: 1 }} />
          <div className="sk" style={{ width: 90, height: 32, borderRadius: 8 }} />
          <div className="sk" style={{ width: 110, height: 32, borderRadius: 8 }} />
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 16px' }}>
            {['Plot Label','Type','Phase','Size','Facing','Status','Actions'].map(h => (
              <div key={h} className="sk" style={{ height: 12, width: '60%' }} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0, padding: '14px 16px', borderBottom: i < 9 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
              <div className="sk" style={{ height: 13, width: '55%' }} />
              <div className="sk" style={{ height: 22, width: 72, borderRadius: 6 }} />
              <div className="sk" style={{ height: 13, width: '40%' }} />
              <div className="sk" style={{ height: 13, width: '65%' }} />
              <div className="sk" style={{ height: 13, width: '50%' }} />
              <div className="sk" style={{ height: 22, width: 80, borderRadius: 20 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="sk" style={{ height: 26, width: 44, borderRadius: 6 }} />
                <div className="sk" style={{ height: 26, width: 52, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
