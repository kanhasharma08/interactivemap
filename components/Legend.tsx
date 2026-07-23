'use client';

import React from 'react';

export default function Legend() {
  const items = [
    { color: '#22c55e', label: 'Available' },
    { color: '#ef4444', label: 'Mortgage' },
    { color: '#eab308', label: 'Sold' },
  ];

  return (
    <div className="legend-widget">
      <div className="legend-title">Plot Status</div>
      {items.map(item => (
        <div key={item.label} className="legend-item">
          <div
            className="legend-dot"
            style={{
              background: item.color,
              borderRadius: '50%',
              width: 12,
              height: 12,
              flexShrink: 0,
              boxShadow: `0 0 6px ${item.color}99`,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
