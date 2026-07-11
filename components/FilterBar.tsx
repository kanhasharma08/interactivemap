'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { PlotStatus } from '@/types';

const FILTERS: { label: string; value: PlotStatus | 'all'; colorClass: string }[] = [
  { label: 'All', value: 'all', colorClass: '' },
  { label: 'Available', value: 'available', colorClass: 'green' },
  { label: 'Sold', value: 'sold', colorClass: 'red' },
  { label: 'Reserved', value: 'reserved', colorClass: 'orange' },
];

export default function FilterBar() {
  const { filterStatus, setFilterStatus } = useApp();

  return (
    <div className="filter-tabs">
      {FILTERS.map(f => (
        <button
          key={f.value}
          className={`filter-tab ${filterStatus === f.value ? `active ${f.colorClass}` : ''}`}
          onClick={() => setFilterStatus(f.value)}
        >
          {f.value !== 'all' && (
            <span style={{
              display: 'inline-block',
              width: 6, height: 6, borderRadius: '50%',
              background: filterStatus === f.value ? 'rgba(255,255,255,0.7)' :
                f.value === 'available' ? '#22c55e' :
                f.value === 'sold' ? '#ef4444' : '#f97316',
              marginRight: 5, verticalAlign: 'middle',
            }} />
          )}
          {f.label}
        </button>
      ))}
    </div>
  );
}
