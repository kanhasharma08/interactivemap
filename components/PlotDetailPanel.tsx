'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useApp } from '@/lib/context';
import { Plot } from '@/types';
import { formatPrice, getStatusColor } from '@/data/plots';

const STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps_images`;

const slideIn: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/* ── Image resolution helpers ────────────────────────────────────────────── */

interface HeroResult {
  images: string[];  // always an array — single-image heroes just have one item
  label: string;
  gradient?: string;
  emoji?: string;
}

/** Mangalam-specific images (under /images/) */
function getMangalamHero(plot: Plot): HeroResult | null {
  const lowerLabel = plot.label.toLowerCase().trim();
  if (lowerLabel.includes('clubhouse') || lowerLabel.includes('club house') || lowerLabel.includes('milaya') || lowerLabel.includes('recreational')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/clubhouse.webp`, `${STORAGE_URL}/mangalamcity/amenities/clubhouse_2.webp`], label: 'Recreational Area' };
  }
  if (lowerLabel.includes('tunnel')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/Relaxing tunnel garden.webp`], label: 'Relaxing Tunnel Garden' };
  }
  if (lowerLabel.includes('relaxing garden') || lowerLabel.includes('relazxing')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/relazxing garden.webp`], label: 'Relaxing Garden' };
  }
  if (lowerLabel.includes('sport')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/sportsplaza.webp`, `${STORAGE_URL}/mangalamcity/amenities/sportsplaza_2.webp`, `${STORAGE_URL}/mangalamcity/amenities/sportsplaza_3.webp`, `${STORAGE_URL}/mangalamcity/amenities/sportsplaza_4.webp`], label: 'Sports Plaza' };
  }
  if (lowerLabel.includes('garden near temple') || lowerLabel.includes('temple garden')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/garden near temple.webp`], label: 'Garden Near Temple' };
  }
  if (lowerLabel.includes('temple')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/temple area.webp`, `${STORAGE_URL}/mangalamcity/amenities/temple_area_2.webp`], label: 'Temple Area' };
  }
  if (lowerLabel.includes('entrance')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/entrance.webp`], label: 'Entrance' };
  }
  if (lowerLabel.includes('lawn') || lowerLabel.includes('multi purpose')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/multipurpose_lawn.webp`], label: 'Multi Purpose Lawn' };
  }
  if (lowerLabel.includes('commercial') || lowerLabel.includes('shop')) {
    return { images: [`${STORAGE_URL}/mangalamcity/amenities/commercial_shops.webp`], label: 'Commercial Shops' };
  }
  return null;
}

/** Bhaavbhumi-specific images (under /bhaavbhumi/amenities/) */
function getBhaavbhumiHero(plot: Plot): HeroResult | null {
  const lowerLabel = plot.label.toLowerCase().trim().replace(/\s+/g, '_');
  const lowerType = plot.type.toLowerCase().trim();
  const facing = (plot.facing ?? '').toUpperCase();

  // ── Type 2 ─────────────────────────────────────────────────────────────────
  if (lowerType === 'type 2' || lowerType === 'type2') {
    if (facing === 'EAST') {
      return {
        images: [
          `${STORAGE_URL}/bhaavbhumi/amenities/type2_east_1.webp`,
          `${STORAGE_URL}/bhaavbhumi/amenities/type2_east_2.webp`,
        ],
        label: 'Type 2 House — East Facing',
      };
    }
    // West: no elevation image yet
    return null;
  }

  // ── Type 3 ─────────────────────────────────────────────────────────────────
  // C1–C7 share the same west elevation renders as the D-series
  if (lowerType === 'type 3' || lowerType === 'type3') {
    if (facing === 'WEST') {
      return {
        images: [
          `${STORAGE_URL}/bhaavbhumi/amenities/type3_west_1.webp`,
          `${STORAGE_URL}/bhaavbhumi/amenities/type3_west_2.webp`,
        ],
        label: 'Type 3 House — West Facing',
      };
    }
    // East-facing: keep existing image
    return { images: [`${STORAGE_URL}/bhaavbhumi/amenities/type3_houses.webp`], label: 'Type 3 House — East Facing' };
  }

  // ── Type 4 ─────────────────────────────────────────────────────────────────
  if (lowerType === 'type 4' || lowerType === 'type4') {
    if (facing === 'WEST') {
      return {
        images: [
          `${STORAGE_URL}/bhaavbhumi/amenities/type4_west_1.webp`,
          `${STORAGE_URL}/bhaavbhumi/amenities/type4_west_2.webp`,
        ],
        label: 'Type 4 House — West Facing',
      };
    }
    // East: new elevation renders
    return {
      images: [
        `${STORAGE_URL}/bhaavbhumi/amenities/type4_east_1.webp`,
        `${STORAGE_URL}/bhaavbhumi/amenities/type4_east_2.webp`,
      ],
      label: 'Type 4 House — East Facing',
    };
  }

  // ── Type 5 ─────────────────────────────────────────────────────────────────
  if (lowerType === 'type 5' || lowerType === 'type5') {
    if (facing === 'WEST') {
      return {
        images: [
          `${STORAGE_URL}/bhaavbhumi/amenities/type5_west_1.webp`,
          `${STORAGE_URL}/bhaavbhumi/amenities/type5_west_2.webp`,
        ],
        label: 'Type 5 House — West Facing',
      };
    }
    // East-facing: keep existing renders
    return {
      images: [
        `${STORAGE_URL}/bhaavbhumi/amenities/type5_houses1.webp`,
        `${STORAGE_URL}/bhaavbhumi/amenities/type5_houses2.webp`,
      ],
      label: 'Type 5 House — East Facing',
    };
  }

  // ── Type 6 ─────────────────────────────────────────────────────────────────
  if (lowerType === 'type 6' || lowerType === 'type6') {
    if (facing === 'EAST') {
      return {
        images: [
          `${STORAGE_URL}/bhaavbhumi/amenities/type6_east_1.webp`,
          `${STORAGE_URL}/bhaavbhumi/amenities/type6_east_2.webp`,
        ],
        label: 'Type 6 House — East Facing',
      };
    }
    // West (L9, L10, L11)
    return {
      images: [
        `${STORAGE_URL}/bhaavbhumi/amenities/type6_west_1.webp`,
        `${STORAGE_URL}/bhaavbhumi/amenities/type6_west_2.webp`,
      ],
      label: 'Type 6 House — West Facing',
    };
  }

  // Multi-image amenities — numbered files get grouped
  const multiMap: Record<string, { files: string[]; label: string }> = {
    club: { files: ['club1', 'club2', 'club3', 'club4'], label: 'Club' },
    multi_sport_court: { files: ['multi_sport_court1', 'multi_sport_court2'], label: 'Multi Sport Court' },
    nukkad: { files: ['nukkad'], label: 'Nukkad' },
    poorva_maya: { files: ['poorva_maya', 'poorva_maya2'], label: 'Poorva Maya' },
    utsav_baag: { files: ['utsav_baag1', 'utsav_baag2'], label: 'Utsav Baag' }
  };

  for (const [key, val] of Object.entries(multiMap)) {
    if (lowerLabel.includes(key.replace('_', ' ')) || lowerLabel.includes(key)) {
      return {
        images: val.files.map(f => `${STORAGE_URL}/bhaavbhumi/amenities/${f}.webp`),
        label: val.label,
      };
    }
  }

  // Single-image amenities
  const singleMap: Record<string, { file: string; label: string }> = {
    'agni': { file: 'agni_court', label: 'Agni Court' },
    'anand': { file: 'anand_baag', label: 'Anand Baag' },
    'ankuram': { file: 'ankuram_court', label: 'Ankuram Court' },
    'experience': { file: 'experience_centre', label: 'Experience Centre' },
    'hans': { file: 'hans_vatika', label: 'Hans Vatika' },
    'entrance': { file: 'main_entrance', label: 'Main Entrance' },
    'jungle': { file: 'jungle_camp', label: 'Jungle Camp' },
    'kids': { file: 'kids_play_area', label: "Kid's Play Area" },
    'niruti': { file: 'niruti_court', label: 'Niruti Court' },
    'spring': { file: 'spring_circle', label: 'Spring Circle' },
    'varun': { file: 'varun_court', label: 'Varun Court' },
    'vayu': { file: 'vayu_court', label: 'Vayu Court' },
    'gym': { file: 'indoor_gym', label: 'Gym' }, // placed after outdoor gym so it acts as fallback
  };

  for (const [key, val] of Object.entries(singleMap)) {
    if (lowerLabel.includes(key)) {
      return {
        images: [`${STORAGE_URL}/bhaavbhumi/amenities/${val.file}.webp`],
        label: val.label,
      };
    }
  }

  return null;
}

function getHeroImage(plot: Plot, siteSlug: string): HeroResult {
  // Site-aware lookup — prevents cross-site image bleed
  const hero =
    siteSlug === 'bhaavbhumi'
      ? getBhaavbhumiHero(plot)
      : getMangalamHero(plot);

  if (hero) return hero;

  // Fallback gradients based on type
  if (plot.type === 'Premium') return { images: [], gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', emoji: '✨', label: 'Premium Plot' };
  if (plot.type === 'Mortgage') return { images: [], gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', emoji: '🏦', label: 'Mortgage Plot' };
  if (plot.type === 'Amenity') return { images: [], gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', emoji: '🏞️', label: 'Amenity Plot' };
  if (plot.type === 'N/A') return { images: [], gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)', emoji: '❓', label: 'Undefined Plot' };
  return { images: [], gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)', emoji: '🏠', label: 'Residential Plot' };
}

/* ── Full-screen lightbox with carousel ─────────────────────────────────── */
function Lightbox({ images, label, startIndex, onClose }: {
  images: string[];
  label: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  const btnStyle: React.CSSProperties = {
    position: 'fixed',
    width: 48, height: 48, borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.9)', zIndex: 1001,
    transition: 'all 0.15s',
    top: '50%', transform: 'translateY(-50%)',
  };

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
      {/* Close */}
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 20, width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.9)', zIndex: 1002, transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Prev Arrow */}
      {images.length > 1 && (
        <button
          style={{ ...btnStyle, left: 20 }}
          onClick={e => { e.stopPropagation(); prev(); }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={`${label} — view ${current + 1}`}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', cursor: 'default' }}
        />
      </AnimatePresence>

      {/* Next Arrow */}
      {images.length > 1 && (
        <button
          style={{ ...btnStyle, right: 20 }}
          onClick={e => { e.stopPropagation(); next(); }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {/* Caption */}
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>{label}</div>
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setCurrent(i); }}
                style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 4, background: i === current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }}
              />
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontStyle: 'italic', marginTop: 6 }}>
          * Image is for illustrative purposes only and may not represent the exact final build.
        </div>
      </div>
    </motion.div>
  );
}

/* ── Status indicator ────────────────────────────────────────────────────── */
function StatusIndicator({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; border: string; label: string }> = {
    available: { color: '#22c55e', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.35)', label: 'Available' },
    sold:      { color: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.35)', label: 'Sold' },
    reserved:  { color: '#f97316', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.35)', label: 'Reserved' },
  };
  const c = config[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.25)', label: status };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1.5px solid ${c.border}`, textTransform: 'capitalize', letterSpacing: '0.3px', backdropFilter: 'blur(8px)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}90`, animation: status === 'available' ? 'pulse-glow 2s ease-in-out infinite' : 'none' }} />
      {c.label}
    </span>
  );
}

/* ── Info row ────────────────────────────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function PlotDetailPanel() {
  const { selectedPlot, setSelectedPlot, siteSlug } = useApp();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const facingIcon = (facing: string) => {
    const icons: Record<string, string> = {
      'North': '⬆️', 'South': '⬇️', 'East': '➡️', 'West': '⬅️',
      'North-East': '↗️', 'North-West': '↖️', 'South-East': '↘️', 'South-West': '↙️',
    };
    return icons[facing] || '🧭';
  };

  useEffect(() => {
    if (!selectedPlot) setLightboxOpen(false);
  }, [selectedPlot]);

  return (
    <>
      <AnimatePresence>
        {selectedPlot && (() => {
          const hero = getHeroImage(selectedPlot, siteSlug);
          const hasImages = hero.images.length > 0;
          const firstImage = hasImages ? hero.images[0] : undefined;

          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="panel-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'absolute', inset: 0, zIndex: 55, background: 'rgba(15,23,42,0.18)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
                onPointerDown={(e) => { e.stopPropagation(); setSelectedPlot(null); }}
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
                  onClick={() => { if (hasImages) { setLightboxIndex(0); setLightboxOpen(true); } }}
                  style={{
                    position: 'relative',
                    background: firstImage
                      ? `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), url("${firstImage}")`
                      : hero.gradient,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    padding: '28px 22px 24px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    minHeight: hasImages ? '200px' : 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    cursor: hasImages ? 'zoom-in' : 'default',
                  }}
                >
                  {/* Expand icon + image count badge */}
                  {hasImages && (
                    <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', pointerEvents: 'none' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                        </svg>
                      </div>
                      {hero.images.length > 1 && (
                        <div style={{ height: 32, padding: '0 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, pointerEvents: 'none' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="8" width="13" height="13" rx="2"/><path d="M5 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/></svg>
                          {hero.images.length} photos
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decorative shapes */}
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                  {/* Close button */}
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedPlot(null); }}
                    style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>

                  {/* Emoji (non-image heroes) */}
                  {!hasImages && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', position: 'relative', zIndex: 1 }}
                    >
                      {hero.emoji}
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
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
                    {selectedPlot.type !== 'Amenity' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>📐</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Plot Size (Area)</span>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', background: 'rgba(100,116,139,0.25)', border: '1px solid rgba(100,116,139,0.45)', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>approx</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedPlot.areaText || `${selectedPlot.sizeSqFt.toLocaleString()} sq.ft`}
                        </span>
                      </div>
                    )}
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

      {/* Fullscreen Lightbox with carousel */}
      <AnimatePresence>
        {lightboxOpen && selectedPlot && (() => {
          const hero = getHeroImage(selectedPlot, siteSlug);
          return hero.images.length > 0 ? (
            <Lightbox
              key="lightbox"
              images={hero.images}
              label={hero.label}
              startIndex={lightboxIndex}
              onClose={() => setLightboxOpen(false)}
            />
          ) : null;
        })()}
      </AnimatePresence>
    </>
  );
}
