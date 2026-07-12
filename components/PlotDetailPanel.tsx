'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useApp } from '@/lib/context';
import { Plot } from '@/types';
import { formatPrice, getStatusColor } from '@/data/plots';

const slideIn: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/* Hero image based on plot label */
function getHeroImage(plot: Plot) {
  const lowerLabel = plot.label.toLowerCase().trim();
  if (lowerLabel.includes('clubhouse') || lowerLabel.includes('club house') || lowerLabel.includes('milaya') || lowerLabel.includes('recreational')) {
    return { imagePath: '/images/clubhouse.webp', label: 'Recreational Area' };
  }
  if (lowerLabel.includes('tunnel')) {
    return { imagePath: '/images/Relaxing tunnel garden.webp', label: 'Relaxing Tunnel Garden' };
  }
  if (lowerLabel.includes('relaxing garden') || lowerLabel.includes('relazxing')) {
    return { imagePath: '/images/relazxing garden.webp', label: 'Relaxing Garden' };
  }
  if (lowerLabel.includes('sport')) {
    return { imagePath: '/images/sportsplaza.webp', label: 'Sports Plaza' };
  }
  if (lowerLabel.includes('garden near temple') || lowerLabel.includes('temple garden')) {
    return { imagePath: '/images/garden near temple.webp', label: 'Garden Near Temple' };
  }
  if (lowerLabel.includes('temple')) {
    return { imagePath: '/images/temple area.webp', label: 'Temple Area' };
  }
  if (plot.type === 'Premium') {
    return { gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', emoji: '✨', label: 'Premium Plot' };
  }
  if (plot.type === 'Mortgage') {
    return { gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', emoji: '🏦', label: 'Mortgage Plot' };
  }
  if (plot.type === 'Amenity') {
    return { gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', emoji: '🏞️', label: 'Amenity Plot' };
  }
  if (plot.type === 'N/A') {
    return { gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)', emoji: '❓', label: 'Undefined Plot' };
  }
  return { gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)', emoji: '🏠', label: 'Residential Plot' };
}

/* Full-screen lightbox */
function Lightbox({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'zoom-out',
        padding: 16,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          width: 44, height: 44, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)', zIndex: 1000,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <motion.img
        src={src}
        alt={label}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '95vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      />
      <div style={{
        marginTop: 14, color: 'rgba(255,255,255,0.7)',
        fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontStyle: 'italic' }}>
          * Image is for illustrative purposes only and may not represent the exact final build.
        </div>
      </div>
    </motion.div>
  );
}

/* Status indicator */
function StatusIndicator({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; border: string; label: string }> = {
    available: { color: '#22c55e', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.35)', label: 'Available' },
    sold:      { color: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.35)', label: 'Sold' },
    reserved:  { color: '#f97316', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.35)', label: 'Reserved' },
  };
  const c = config[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.25)', label: status };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1.5px solid ${c.border}`,
      textTransform: 'capitalize', letterSpacing: '0.3px',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: c.color,
        boxShadow: `0 0 8px ${c.color}90`,
        animation: status === 'available' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}

/* Info row item */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-light)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function PlotDetailPanel() {
  const { selectedPlot, setSelectedPlot } = useApp();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const facingIcon = (facing: string) => {
    const icons: Record<string, string> = {
      'North': '⬆️', 'South': '⬇️', 'East': '➡️', 'West': '⬅️',
      'North-East': '↗️', 'North-West': '↖️', 'South-East': '↘️', 'South-West': '↙️',
    };
    return icons[facing] || '🧭';
  };

  // Close lightbox if panel is dismissed
  useEffect(() => {
    if (!selectedPlot) setLightboxOpen(false);
  }, [selectedPlot]);

  return (
    <>
      <AnimatePresence>
        {selectedPlot && (() => {
          const hero = getHeroImage(selectedPlot);
          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="panel-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 55,
                  background: 'rgba(15,23,42,0.18)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                }}
                onPointerDown={(e) => {
                  // Use pointerDown (not onClick) so synthetic click events from the
                  // tap that opened the panel don't immediately close it on mobile
                  e.stopPropagation();
                  setSelectedPlot(null);
                }}
              />

              {/* Panel */}
              <motion.div
                key="panel"
                className="side-panel"
                variants={slideIn}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ position: 'absolute', top: 12, right: 12, bottom: 12, zIndex: 60 }}
              >
                {/* ─── Hero / Header ─── */}
                <div
                  onClick={() => { if (hero.imagePath) setLightboxOpen(true); }}
                  style={{
                    position: 'relative',
                    background: hero.imagePath
                      ? `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), url("${hero.imagePath}")`
                      : (hero as any).gradient,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    padding: '28px 22px 24px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    minHeight: hero.imagePath ? '200px' : 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    cursor: hero.imagePath ? 'zoom-in' : 'default',
                  }}
                >
                  {/* Expand icon — only shown when there's a real image */}
                  {hero.imagePath && (
                    <div style={{
                      position: 'absolute', top: 14, left: 14,
                      width: 32, height: 32, borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(0,0,0,0.35)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.85)',
                      pointerEvents: 'none',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                      </svg>
                    </div>
                  )}

                  {/* Decorative shapes */}
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: 20, left: '30%', width: 60, height: 60, borderRadius: 12, background: 'rgba(255,255,255,0.02)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

                  {/* Close button */}
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedPlot(null); }}
                    style={{
                      position: 'absolute', top: 14, right: 14,
                      width: 32, height: 32, borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.8)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>

                  {/* Emoji (only for non-image heroes) */}
                  {!hero.imagePath && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', position: 'relative', zIndex: 1 }}
                    >
                      {(hero as any).emoji}
                    </motion.div>
                  )}

                  {/* Title */}
                  <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.1 }} style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#fff', letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 4, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                      {selectedPlot.label}
                    </div>
                    {selectedPlot.label.toLowerCase().trim() !== hero.label.toLowerCase().trim() && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, letterSpacing: 0.3, textShadow: '0 2px 8px rgba(0,0,0,0.4)', marginBottom: 14 }}>
                        {hero.label}
                      </div>
                    )}
                  </motion.div>

                  {/* Badges */}
                  <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.15 }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedPlot.type !== 'Amenity' && selectedPlot.status !== 'N/A' && <StatusIndicator status={selectedPlot.status} />}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                    }}>
                      {selectedPlot.type}
                    </span>
                  </motion.div>
                </div>

                {/* ─── Details Body ─── */}
                <div className="panel-body" style={{ padding: '20px 22px' }}>
                  <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.25 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {selectedPlot.type === 'Amenity' ? 'Details' : 'Plot Details'}
                    </div>
                    {selectedPlot.type !== 'Amenity' && <InfoRow icon="📐" label="Plot Size (Area)" value={selectedPlot.areaText || `${selectedPlot.sizeSqFt.toLocaleString()} sq.ft`} />}
                    {selectedPlot.type !== 'Amenity' && selectedPlot.facing !== 'N/A' && <InfoRow icon={facingIcon(selectedPlot.facing)} label="Facing" value={selectedPlot.facing} />}
                    {selectedPlot.type !== 'Amenity' && selectedPlot.phase !== 'N/A' && <InfoRow icon="🏘️" label="Phase" value={`Phase ${selectedPlot.phase}`} />}
                    {selectedPlot.type !== 'Amenity' && <InfoRow icon="🏷️" label="Plot No." value={selectedPlot.label} />}
                    <InfoRow icon="📋" label="Type" value={selectedPlot.type === 'Residential' ? 'Plot' : selectedPlot.type} />
                  </motion.div>

                  <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.3 }} style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Township Features
                    </div>
                    {[
                      { icon: '🔒', text: '24×7 Gated Security' },
                      { icon: '🛣️', text: 'Wide Internal Roads' },
                      { icon: '⚡', text: 'Underground Utilities' },
                      { icon: '🌳', text: 'Landscaped Parks & Gardens' },
                    ].map((f, i) => (
                      <motion.div
                        key={f.text}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.04, duration: 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.03)' }}
                      >
                        <span style={{ fontSize: 13 }}>{f.icon}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{f.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxOpen && selectedPlot && (() => {
          const hero = getHeroImage(selectedPlot);
          return hero.imagePath ? (
            <Lightbox
              key="lightbox"
              src={hero.imagePath}
              label={hero.label ?? selectedPlot.label}
              onClose={() => setLightboxOpen(false)}
            />
          ) : null;
        })()}
      </AnimatePresence>
    </>
  );
}
