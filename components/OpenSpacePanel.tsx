'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OpenSpace } from '@/types';

interface OpenSpacePanelProps {
  openSpace: OpenSpace | null;
  onClose: () => void;
}

const typeConfig = {
  park: { emoji: '🌳', label: 'Park', color: '#16a34a', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  garden: { emoji: '🌿', label: 'Garden', color: '#15803d', bg: 'rgba(134,239,172,0.1)', border: 'rgba(74,222,128,0.25)' },
  amenity: { emoji: '🏛️', label: 'Community Amenity', color: '#1d4ed8', bg: 'rgba(59,130,246,0.08)', border: 'rgba(96,165,250,0.2)' },
  multipurpose: { emoji: '⭐', label: 'Multipurpose Zone', color: '#7e22ce', bg: 'rgba(168,85,247,0.08)', border: 'rgba(192,132,252,0.2)' },
};

export default function OpenSpacePanel({ openSpace, onClose }: OpenSpacePanelProps) {
  if (!openSpace) return null;
  const cfg = typeConfig[openSpace.type];

  return (
    <AnimatePresence>
      {openSpace && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            position: 'absolute',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
            padding: '20px 24px',
            width: 440,
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              {cfg.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{openSpace.name}</h3>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {cfg.label}
                </span>
              </div>
              {openSpace.area && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Area: {openSpace.area}</div>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {openSpace.description}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: 'var(--text-muted)', flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {openSpace.amenities && openSpace.amenities.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
                Amenities & Features
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {openSpace.amenities.map(a => (
                  <span key={a} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
