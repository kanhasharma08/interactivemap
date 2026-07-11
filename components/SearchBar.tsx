'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { PLOTS } from '@/data/plots';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, setSelectedPlot, plots } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = React.useState<typeof PLOTS>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  useEffect(() => {
    setTimeout(() => {
      if (!searchQuery || searchQuery.length < 1) {
        setSuggestions([]);
        return;
      }
      const matches = plots.filter(p =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 0);
  }, [searchQuery, plots]);

  const handleSelect = (plotId: string) => {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;
    setSelectedPlot(plot);
    setSearchQuery(plot.label);
    setShowSuggestions(false);
    // Focus plot on map
    const focusFn = (window as unknown as Record<string, unknown>).__focusPlot as ((p: typeof plot) => void) | undefined;
    focusFn?.(plot);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search plot e.g. H-72"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 50,
        }}>
          {suggestions.map((plot, i) => (
            <div
              key={plot.id}
              onMouseDown={() => handleSelect(plot.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: plot.status === 'available' ? '#22c55e' : plot.status === 'sold' ? '#ef4444' : '#f97316',
                }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{plot.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ph.{plot.phase}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                  background: plot.status === 'available' ? 'var(--green-bg)' : plot.status === 'sold' ? 'var(--red-bg)' : 'var(--orange-bg)',
                  color: plot.status === 'available' ? 'var(--green)' : plot.status === 'sold' ? 'var(--red)' : 'var(--orange)',
                }}>
                  {plot.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
