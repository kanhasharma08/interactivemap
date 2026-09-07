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
  /** If true, renders as a large flat text logo on the floor instead of a popup */
  isFloorLogo?: boolean;
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
const ICONS: Record<string, string> = {
  hospital: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  train: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/><path d="M2 14h20"/></svg>`,
  bus: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 11h20"/><path d="M6 17v4"/><path d="M18 17v4"/><circle cx="8" cy="13" r="1"/><circle cx="16" cy="13" r="1"/></svg>`,
  buildings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  shopping: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  school: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  event: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  food: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  temple: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M8 22h8"/><path d="M12 6l-4 4h8z"/><path d="M12 14l-6 4h12z"/></svg>`,
  city: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
};

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
  const targetHfovRef= useRef<number | null>(null);
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

    if (hs.isFloorLogo) {
      hotspotDiv.style.cssText += `
        background: none !important;
        border: none !important;
        width: 0; height: 0;
        overflow: visible;
      `;
      const container = document.createElement('div');
      container.style.cssText = `
        position: absolute;
        left: -200px; top: -70px;
        width: 400px; height: 140px;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
        transform: perspective(600px) rotateX(60deg);
        transform-origin: center bottom;
      `;
      
      const img = document.createElement('img');
      img.src = '/mangalam-logo.png';
      img.style.cssText = `
        width: 380px;
        height: auto;
        opacity: 1;
        filter: drop-shadow(0 0 20px rgba(0,0,0,0.9)) brightness(1.2);
        image-rendering: crisp-edges;
      `;
      
      container.appendChild(img);
      hotspotDiv.appendChild(container);
      
      // Do NOT push to bubbleRefs so it ignores fade/scale logic
      return;
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
      border: 3px solid #222;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      z-index: 3;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    `;
    
    if (hs.icon && ICONS[hs.icon]) {
      const iconSpan = document.createElement('span');
      iconSpan.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;';
      iconSpan.innerHTML = ICONS[hs.icon];
      circle.appendChild(iconSpan);
    } else {
      const logo = document.createElement('img');
      logo.src = '/mangalam-logo.png';
      logo.style.cssText = 'width: 24px; height: auto; object-fit: contain; filter: grayscale(100%);';
      circle.appendChild(logo);
    }

    // 4. Outer Rectangle for the Green Border
    const rectOuter = document.createElement('div');
    const outerClip = isLeft 
      ? 'polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
      : 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)';
    const innerClip = isLeft
      ? 'polygon(0 0, 100% 0, 100% 100%, 7px 100%, 0 calc(100% - 7px))'
      : 'polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)';
      
    const pTop = '2px', pBottom = '2px';
    const pLeft = isLeft ? '2px' : '0';
    const pRight = isLeft ? '0' : '2px';
    
    rectOuter.style.cssText = `
      background: #00c853;
      padding: ${pTop} ${pRight} ${pBottom} ${pLeft};
      clip-path: ${outerClip};
      display: flex;
      height: 36px;
      ${isLeft ? 'margin-right: -20px;' : 'margin-left: -20px;'}
      ${isLeft ? 'padding-right: 20px;' : 'padding-left: 20px;'}
      z-index: 2;
    `;

    // 5. Inner Rectangle
    const rectInner = document.createElement('div');
    rectInner.style.cssText = `
      background: #111;
      clip-path: ${innerClip};
      display: flex; align-items: center; gap: 6px;
      padding: 0 16px;
      ${isLeft ? 'padding-right: 12px;' : 'padding-left: 12px;'}
      height: 100%;
    `;
    
    const title = document.createElement('span');
    title.style.cssText = `
      font-family: 'Inter', 'Outfit', sans-serif;
      font-size: 11px; font-weight: 800;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #fff;
    `;
    title.textContent = hs.label;
    rectInner.appendChild(title);

    if (hs.distance) {
      const dist = document.createElement('span');
      dist.style.cssText = `
        font-family: 'Inter', sans-serif;
        font-size: 9px; font-weight: 500;
        color: #aaa;
        white-space: nowrap;
        margin-left: 4px;
      `;
      dist.textContent = hs.distance;
      rectInner.appendChild(dist);
    }

    rectOuter.appendChild(rectInner);
    
    labelWrapper.appendChild(circle);
    labelWrapper.appendChild(rectOuter);

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
        // --- Smooth Zoom Lerp ---
        if (targetHfovRef.current !== null) {
          const ch = viewerRef.current.getHfov();
          if (Math.abs(targetHfovRef.current - ch) > 0.1) {
            viewerRef.current.setHfov(ch + (targetHfovRef.current - ch) * 0.14, false);
          } else {
            targetHfovRef.current = null; // Reached target, hand control back
          }
        }

        const cy = viewerRef.current.getYaw();
        const cp = viewerRef.current.getPitch();

        if (coordsRef.current) {
          coordsRef.current.textContent = `Yaw: ${cy.toFixed(2)}° | Pitch: ${cp.toFixed(2)}°`;
        }

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
        mouseZoom: false, // Turn off native choppy zoom
        friction: 0.20, // Increased friction (heavier momentum) so it doesn't spin too fast
        touchPanSpeedCoeffFactor: 0.7, // Slow down touch screen swipe sensitivity
        yaw: initialYaw,
        pitch: initialPitch,
        hfov: initialHfov,
        minHfov: 50,
        maxHfov: 120,
        hotSpots: panoHotspots,
      });

      // Start after Pannellum has rendered its first frame
      setTimeout(() => { if (!dead) startLoop(); }, 500);

      // --- Custom Smooth Wheel Zoom ---
      // We intercept the wheel event in the capture phase to stop Pannellum's choppy native zoom
      const handleWheel = (e: WheelEvent) => {
        if (!viewerRef.current) return;
        e.preventDefault();
        e.stopPropagation(); // Prevent Pannellum from seeing the wheel event
        
        const currentTarget = targetHfovRef.current ?? viewerRef.current.getHfov();
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16; // Adjust for line-based scrolling
        
        let newTarget = currentTarget + delta * 0.06;
        newTarget = Math.max(50, Math.min(120, newTarget)); // Clamp to min/max HFOV
        targetHfovRef.current = newTarget;
      };
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false, capture: true });

      // Cancel smooth zoom on touch so it doesn't fight native pinch-to-zoom
      containerRef.current.addEventListener('touchstart', () => {
        targetHfovRef.current = null;
      }, { passive: true });

    };

    init();

    return () => {
      dead = true;
      cancelAnimationFrame(rafRef.current);
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch { /* ignore */ }
        viewerRef.current = null;
      }
      // Note: event listener is destroyed with the DOM node, but good practice to clear if possible
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#080810', overflow: 'hidden', touchAction: 'none' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />




      <style>{`
        /* Kill Pannellum branding (keep debug msg visible) */
        .pnl-compass, .pnl-about-msg { display: none !important; }
        .pannellum-container { background: #080810 !important; }

        /* Kill default hotspot dot/circle entirely */
        .pnl-hotspot { background: none !important; border: none !important; }
        .pnl-hotspot::after { display: none !important; }
        .pnl-hotspot-base { display: none !important; }

        /* Hide Pannellum default loading text and bar */
        .pnl-load-box p { display: none !important; }
        .pnl-lbar { display: none !important; }

        /* Custom beautiful buffering spinner */
        .pnl-load-box {
          background-color: transparent !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .pnl-load-box::before {
          content: "";
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-bottom-color: #00c853; /* Match green theme */
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: pnl-rotation 1s linear infinite;
        }

        @keyframes pnl-rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Glowing pulse animation for the green dot */
        @keyframes pnl-pulse {
          0%, 100% { box-shadow: 0 0 5px 1px rgba(74,222,128,0.5); }
          50%       { box-shadow: 0 0 12px 4px rgba(74,222,128,0.85); }
        }
      `}</style>
    </div>
  );
}
