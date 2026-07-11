'use client';

import React from 'react';

export default function Legend() {
  const items = [
    { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: 'Premium', border: '#fde047' },
    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Mortgage', border: '#fca5a5' },
    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Amenity', border: '#c4b5fd' },
    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Plots', border: '#cbd5e1' },
    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Open Space', border: 'rgba(34,197,94,0.2)', dashed: true },
  ];

  return (
    <div className="legend-widget">
      <div className="legend-title">Plot Types</div>
      {items.map(item => (
        <div key={item.label} className="legend-item">
          <div
            className="legend-dot"
            style={{
              background: item.dashed ? 'transparent' : item.bg,
              border: `1.5px ${item.dashed ? 'dashed' : 'solid'} ${item.border}`,
              boxShadow: item.dashed ? 'none' : `inset 0 0 0 2px ${item.color}`,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
