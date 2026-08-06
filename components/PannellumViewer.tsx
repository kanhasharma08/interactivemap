'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VrHotspot {
  yaw: number;
  pitch: number;
  label: string;
  distance?: string;
  icon?: string;
  /** Direction the label pops out. Default 'up-right' */
  direction?: 'up-right' | 'down-right' | 'up-left' | 'down-left';
  /** Degrees from centre: fully visible within this radius. Default 20 */
  visibleRadius?: number;
  /** Degrees from centre: completely invisible beyond this radius. Default 38 */
  fadeRadius?: number;
}

interface PannellumViewerProps {
  imagePath: string;
  previewPath?: string;
  hotspots?: VrHotspot[];
  initialYaw?: number;
  initialPitch?: number;
  initialHfov?: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pannellum: any;
  }
}

// ── Angular distance (degrees) between two yaw/pitch points ───────────────────
function angularDistance(y1: number, p1: number, y2: number, p2: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const sp = Math.sin((r(p2) - r(p1)) / 2);
  const sy = Math.sin((r(y2) - r(y1)) / 2);
  const a  = sp * sp + Math.cos(r(p1)) * Math.cos(r(p2)) * sy * sy;
  return (2 * Math.asin(Math.sqrt(Math.min(1, a))) * 180) / Math.PI;
}

// ── Pannellum asset injection ──────────────────────────────────────────────────
const CSS_URL = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
const JS_URL  = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';

function loadPannellum(): Promise<void> {
  return new Promise((resolve) => {
    if (window.pannellum) { resolve(); return; }
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = CSS_URL;
      document.head.appendChild(l);
    }
    if (document.querySelector(`script[src="${JS_URL}"]`)) {
      const wait = setInterval(() => { if (window.pannellum) { clearInterval(wait); resolve(); } }, 40);
    } else {
      const s = document.createElement('script');
      s.src = JS_URL;
      s.onload = () => resolve();
      document.head.appendChild(s);
    }
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function PannellumViewer({
  imagePath,
  previewPath,
  hotspots = [],
  initialYaw   = 0,
  initialPitch = 0,
  initialHfov  = 100,
}: PannellumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef    = useRef<any>(null);
  const rafRef       = useRef<number>(0);
  // store ref to each label bubble (the element whose opacity we drive)
  const bubbleRefs   = useRef<(HTMLElement | null)[]>([]);

  // Build the bubble DOM element and append it into the Pannellum hotspot div.
  // Pannellum calls createTooltipFunc(hotspotDiv, args) — first arg is the div.
  const attachLabel = useCallback((hotspotDiv: HTMLElement, hs: VrHotspot, idx: number) => {
    const dir = hs.direction || 'up-right';
    const isLeft = dir === 'up-left' || dir === 'down-left';
    
    let lineRotate = '-45deg';
    let dx = 42.4;
    let dy = -42.4;

    if (dir === 'down-right') {
      lineRotate = '45deg';
      dy = 42.4;
    } else if (dir === 'up-left') {
      lineRotate = '-135deg';
      dx = -42.4;
    } else if (dir === 'down-left') {
      lineRotate = '135deg';
      dx = -42.4;
      dy = 42.4;
    }

    // Hotspot div is positioned exactly at the yaw/pitch coordinate (the ground anchor)
    hotspotDiv.style.cssText += `
      background: none !important;
      border: none !important;
      width: 0; height: 0;
      overflow: visible;
    `;

    // Master container for opacity/scale animation
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s ease;
      will-change: opacity, transform;
      pointer-events: none;
    `;

    // 1. Diagonal line pointing from the anchor
    const line = document.createElement('div');
    line.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: 60px; height: 2px;
      background: #111;
      transform-origin: left center;
      transform: rotate(${lineRotate});
      z-index: 1;
    `;

    // 2. Wrapper for the Circle + Rectangle, positioned at the end of the line
    const labelWrapper = document.createElement('div');
    labelWrapper.style.cssText = `
      position: absolute;
      left: ${dx}px; top: ${dy}px;
      /* Translate to center the 44px circle exactly on the end of the line */
      transform: translate(${isLeft ? 'calc(-100% + 22px)' : '-22px'}, -22px);
      display: flex; align-items: center;
      ${isLeft ? 'flex-direction: row-reverse;' : ''}
      z-index: 2;
    `;

    // 3. Circle with icon
    const circle = document.createElement('div');
    circle.style.cssText = `
      width: 44px; height: 44px;
      background: #fff;
      border: 3px solid #111;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      z-index: 3;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    `;
    
    if (hs.icon) {
      const icon = document.createElement('span');
      icon.style.cssText = 'font-size: 22px; line-height: 1; filter: grayscale(100%) contrast(200%);';
      icon.textContent = hs.icon;
      circle.appendChild(icon);
    } else {
      const logo = document.createElement('img');
      logo.src = '/mangalam-logo.png';
      logo.style.cssText = 'width: 24px; height: auto; object-fit: contain; filter: grayscale(100%);';
      circle.appendChild(logo);
    }

    // 4. Rectangle with green border
    const rect = document.createElement('div');
    rect.style.cssText = `
      background: #111;
      border: 3px solid #00c853; /* Bright green border */
      ${isLeft ? 'border-right: none;' : 'border-left: none;'}
      ${isLeft ? 'border-top-left-radius: 4px; border-bottom-left-radius: 4px;' : 'border-top-right-radius: 4px; border-bottom-right-radius: 4px;'}
      padding: 6px 12px;
      ${isLeft ? 'padding-right: 20px; margin-right: -14px;' : 'padding-left: 20px; margin-left: -14px;'}
      z-index: 2;
      color: #fff;
      display: flex; align-items: baseline; gap: 6px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    `;
    
    const title = document.createElement('span');
    title.style.cssText = `
      font-family: 'Inter', 'Outfit', sans-serif;
      font-size: 13px; font-weight: 800;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    title.textContent = hs.label;
    rect.appendChild(title);

    if (hs.distance) {
      const dist = document.createElement('span');
      dist.style.cssText = `
        font-family: 'Inter', sans-serif;
        font-size: 11px; font-weight: 500;
        color: #d1d5db; /* Light grey */
        white-space: nowrap;
      `;
      dist.textContent = hs.distance;
      rect.appendChild(dist);
    }

    labelWrapper.appendChild(circle);
    labelWrapper.appendChild(rect);

    container.appendChild(line);
    container.appendChild(labelWrapper);
    
    hotspotDiv.appendChild(container);
    bubbleRefs.current[idx] = container;
  }, []);

  // rAF loop — drives opacity of every bubble based on angular distance to camera
  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = () => {
      if (!viewerRef.current) return;
      try {
        const cy = viewerRef.current.getYaw();
        const cp = viewerRef.current.getPitch();

        hotspots.forEach((hs, i) => {
          const el = bubbleRefs.current[i];
          if (!el) return;
          const dist    = angularDistance(cy, cp, hs.yaw, hs.pitch);
          const vr      = hs.visibleRadius ?? 20;
          const fr      = hs.fadeRadius    ?? 38;
          let opacity = 0;
          if      (dist <= vr) opacity = 1;
          else if (dist <  fr) opacity = 1 - (dist - vr) / (fr - vr);
          el.style.opacity   = opacity.toFixed(3);
          const s = 0.9 + opacity * 0.1;
          el.style.transform = `scale(${s.toFixed(3)})`;
        });
      } catch { /* viewer not ready yet */ }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [hotspots]);

  useEffect(() => {
    let dead = false;

    const init = async () => {
      await loadPannellum();
      if (dead || !containerRef.current) return;

      const panoHotspots = hotspots.map((hs, i) => ({
        type: 'custom',
        yaw: hs.yaw,
        pitch: hs.pitch,
        // Pannellum passes the hotspot <div> as the first argument
        createTooltipFunc: (div: HTMLElement) => attachLabel(div, hs, i),
      }));

      viewerRef.current = window.pannellum.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: imagePath,
        preview: previewPath,
        autoLoad: true,
        autoRotate: -1.2,
        autoRotateInactivityDelay: 3500,
        compass: false,
        showZoomCtrl: false,
        showFullscreenCtrl: false,
        showControls: false,
        mouseZoom: true,
        friction: 0.12,
        yaw: initialYaw,
        pitch: initialPitch,
        hfov: initialHfov,
        minHfov: 50,
        maxHfov: 120,
        hotSpots: panoHotspots,
      });

      // Start after Pannellum has rendered its first frame
      setTimeout(() => { if (!dead) startLoop(); }, 500);
    };

    init();

    return () => {
      dead = true;
      cancelAnimationFrame(rafRef.current);
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch { /* ignore */ }
        viewerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#080810', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <style>{`
        /* Kill Pannellum branding */
        .pnl-compass, .pnl-about-msg, .pnl-hotspot-debug-msg { display: none !important; }
        .pannellum-container { background: #080810 !important; }

        /* Kill default hotspot dot/circle entirely */
        .pnl-hotspot { background: none !important; border: none !important; }
        .pnl-hotspot::after { display: none !important; }
        .pnl-hotspot-base { display: none !important; }

        /* Glowing pulse animation for the green dot */
        @keyframes pnl-pulse {
          0%, 100% { box-shadow: 0 0 5px 1px rgba(74,222,128,0.5); }
          50%       { box-shadow: 0 0 12px 4px rgba(74,222,128,0.85); }
        }
      `}</style>
    </div>
  );
}
