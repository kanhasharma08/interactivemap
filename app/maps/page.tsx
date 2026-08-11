'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { SITE_CONFIGS } from '@/data/sites';

// ── Config ────────────────────────────────────────────────────────────────────
const SUNCITY_PROJECTS = [
  { name: 'Suncity Extension' },
  { name: 'Suncity Anantam' },
  { name: 'Suncity Samosaran' },
];

// Uniform accent glow colour for all cards (Premium Gold)
const UNIFORM_ACCENT = '251,191,36';

const SITE_LIST = Object.values(SITE_CONFIGS).map(site => ({
  slug: site.slug,
  name: site.name,
  // Use the transparent trimmed logo specifically for Bhaavbhumi
  logoPath: site.slug === 'bhaavbhumi' ? '/bhaavbhumi-logo-trimmed.png' : (site.logoPath || site.logos?.[0]?.path || null),
  reraNumber: site.reraNumber || null,
  reraNumbers: site.logos?.map(l => ({ label: l.label, rera: l.reraNumber })) || null,
  subProjects: site.slug === 'suncity' ? SUNCITY_PROJECTS : null,
  accent: UNIFORM_ACCENT,
}));

// ── Navigation ────────────────────────────────────────────────────────────────
function navigateTo(slug: string) {
  if (typeof window === 'undefined') return;
  const h = window.location.hostname;
  const isLocal = h.includes('localhost') || h.includes('127.0.0.1');
  const isVercel = h.endsWith('.vercel.app') || h.endsWith('.now.sh');
  if (isLocal || isVercel) {
    document.cookie = `testSiteSlug=${slug}; path=/; max-age=86400`;
    window.location.href = '/';
  } else {
    const base = h.split('.').slice(-2).join('.');
    window.location.href = `https://${slug}.${base}`;
  }
}

// ── Animated grid background ──────────────────────────────────────────────────
function GridBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
      `,
      backgroundSize: '52px 52px',
    }} />
  );
}

// ── Floating orbs ─────────────────────────────────────────────────────────────
function Orbs() {
  return (
    <>
      <div style={{
        position: 'fixed', top: '-15%', left: '-8%',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
        animation: 'drift1 18s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
        animation: 'drift2 22s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '15%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
        animation: 'drift1 14s ease-in-out infinite alternate-reverse',
      }} />
    </>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function MapCard({ site, index }: { site: typeof SITE_LIST[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80 + index * 130);
    return () => clearTimeout(t);
  }, [index]);

  const rgb = site.accent;

  return (
    <div
      onClick={() => navigateTo(site.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        opacity: entered ? 1 : 0,
        transform: entered ? (hovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)') : 'translateY(28px) scale(0.98)',
        transition: entered
          ? 'opacity 0.5s, transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s, border-color 0.3s'
          : 'opacity 0.55s ease, transform 0.55s ease',
        cursor: 'pointer',
        borderRadius: 22,
        border: hovered
          ? `1px solid rgba(${rgb},0.55)`
          : '1px solid rgba(255,255,255,0.12)',
        background: hovered
          ? `linear-gradient(145deg, rgba(${rgb},0.12) 0%, rgba(25,32,48,0.98) 60%)`
          : 'rgba(25,32,48,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: hovered
          ? `0 0 0 1px rgba(${rgb},0.2), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(${rgb},0.15)`
          : '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 320,
        padding: '28px 26px 24px',
      }}
    >
      {/* Glow top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, rgba(${rgb},${hovered ? 0.8 : 0.3}) 50%, transparent 100%)`,
        transition: 'opacity 0.4s',
        borderRadius: '22px 22px 0 0',
      }} />

      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 160, height: 160, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},${hovered ? 0.15 : 0.06}) 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'opacity 0.4s',
      }} />

      {/* ── Logo area — transparent, logos inverted to white silhouettes ── */}
      <div style={{
        width: '100%',
        height: 90,
        borderRadius: 14,
        background: `rgba(${rgb},0.06)`,
        border: `1px solid rgba(${rgb},${hovered ? 0.18 : 0.08})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'border-color 0.3s, background 0.3s',
      }}>
        {site.logoPath ? (
          <Image
            src={site.logoPath}
            alt={site.name}
            width={220}
            height={90}
            style={{
              objectFit: 'contain',
              maxWidth: '80%',
              maxHeight: 72,
              opacity: hovered ? 1 : 0.85,
              transition: 'opacity 0.3s',
              // Add a subtle white glow behind the logos so their natural colors pop on the dark background
              filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.25))',
            }}
          />
        ) : (
          <span style={{
            fontSize: 34, fontWeight: 800,
            color: `rgba(${rgb},0.9)`,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {site.name.charAt(0)}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Sub-projects (Suncity) or site name */}
        {site.subProjects ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {site.subProjects.map(p => (
              <h2 key={p.name} style={{
                margin: 0,
                fontSize: 20, fontWeight: 700,
                color: hovered ? '#ffffff' : 'rgba(255,255,255,0.86)',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.3px',
                lineHeight: 1.25,
                transition: 'color 0.25s',
              }}>
                {p.name}
              </h2>
            ))}
          </div>
        ) : (
          <h2 style={{
            margin: '0 0 10px',
            fontSize: 20, fontWeight: 700,
            color: hovered ? '#ffffff' : 'rgba(255,255,255,0.86)',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.3px',
            lineHeight: 1.25,
            transition: 'color 0.25s',
          }}>
            {site.name}
          </h2>
        )}

        {/* RERA numbers */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {site.reraNumbers ? (
            site.reraNumbers.map(r => (
              <div key={r.rera} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '2px 5px',
                  borderRadius: 4, letterSpacing: '0.8px',
                  background: `rgba(${rgb},0.14)`,
                  color: `rgba(${rgb},0.9)`,
                }}>RERA</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.3px' }}>
                  {r.rera}
                </span>
              </div>
            ))
          ) : site.reraNumber ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                fontSize: 8, fontWeight: 700, padding: '2px 5px',
                borderRadius: 4, letterSpacing: '0.8px',
                background: `rgba(${rgb},0.14)`,
                color: `rgba(${rgb},0.9)`,
              }}>RERA</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.3px' }}>
                {site.reraNumber}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 22, paddingTop: 18,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.3px',
          color: hovered ? `rgba(${rgb},0.95)` : 'rgba(255,255,255,0.3)',
          transition: 'color 0.3s',
        }}>
          Open interactive map
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: hovered ? `rgba(${rgb},0.18)` : 'rgba(255,255,255,0.05)',
          border: `1px solid rgba(${rgb},${hovered ? 0.45 : 0.1})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
          transform: hovered ? 'translateX(4px)' : 'none',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={hovered ? `rgba(${rgb},1)` : 'rgba(255,255,255,0.5)'} strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MapsLandingPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 50); }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0d1117 0%, #111827 40%, #0f172a 70%, #0d1117 100%)',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>
      <GridBackground />
      <Orbs />

      {/* ── Header: just the logo, centred ── */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', justifyContent: 'center',
        paddingTop: 52,
        opacity: ready ? 1 : 0,
        transform: ready ? 'none' : 'translateY(-8px)',
        transition: 'opacity 0.65s ease, transform 0.65s ease',
      }}>
        {/*
          Logo sits on a very subtle dark-to-transparent pill so the white
          parts of the PNG don't bleed into the page background.
          Using mix-blend-mode: multiply so white areas become transparent.
        */}
        <div style={{ position: 'relative' }}>
          <Image
            src="/mahavir-logo.png"
            alt="Mahavir Group"
            width={240}
            height={70}
            style={{
              objectFit: 'contain',
              height: 70, width: 'auto',
              // White PNG on dark bg: invert makes it look natural
              filter: 'brightness(0) invert(1)',
              opacity: 0.92,
            }}
            priority
          />
        </div>
      </header>

      {/* ── Tagline ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center',
        marginTop: 20,
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.65s ease 0.15s',
      }}>
        <p style={{
          margin: 0,
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.5px',
          fontWeight: 400,
        }}>
          Select a map and start exploring
        </p>
      </div>

      {/* Thin separator */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: 48, height: 1, margin: '28px auto 40px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
      }} />

      {/* ── Cards ── */}
      <main style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1060, margin: '0 auto',
        padding: '0 24px 88px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 22,
          alignItems: 'stretch',
        }}>
          {SITE_LIST.map((site, i) => (
            <MapCard key={site.slug} site={site} index={i} />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 60, paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.14)' }}>
            Mahavir Group · Rajnandgaon, Chhattisgarh
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.14)' }}>
            All projects RERA approved
          </span>
        </div>
      </main>

      <style>{`
        @keyframes drift1 {
          from { transform: translate(0px, 0px) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.06); }
        }
        @keyframes drift2 {
          from { transform: translate(0px, 0px) scale(1); }
          to   { transform: translate(-25px, -18px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}
