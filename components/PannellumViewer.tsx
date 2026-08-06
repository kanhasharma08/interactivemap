'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// --- Types -------------------------------------------------------------------

export interface VrHotspot {
  /** Horizontal angle in degrees. 0 = front, positive = right */
  yaw: number;
  /** Vertical angle in degrees. 0 = horizon, positive = up, negative = down */
  pitch: number;
  /** Label text shown to the user */
  label: string;
  /** Optional icon emoji */
  icon?: string;
  /** Angular radius (degrees) within which the label is fully visible. Default 25 */
  visibleRadius?: number;
  /** Angular radius (degrees) at which the label starts fading. Default 40 */
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

function angularDistance(yaw1: number, pitch1: number, yaw2: number, pitch2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const p1 = toRad(pitch1);
  const p2 = toRad(pitch2);
  const dy = toRad(yaw2 - yaw1);
  const sinP = Math.sin((p2 - p1) / 2);
  const sinY = Math.sin(dy / 2);
  const a = sinP * sinP + Math.cos(p1) * Math.cos(p2) * sinY * sinY;
  return (2 * Math.asin(Math.sqrt(a)) * 180) / Math.PI;
}

const PANNELLUM_CSS_URL = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
const PANNELLUM_JS_URL  = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';

function injectPannellumAssets(): Promise<void> {
  return new Promise((resolve) => {
    if (window.pannellum) { resolve(); return; }
    if (!document.querySelector(`link[href="${PANNELLUM_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = PANNELLUM_CSS_URL;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${PANNELLUM_JS_URL}"]`)) {
      const script = document.createElement('script');
      script.src = PANNELLUM_JS_URL;
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => { if (window.pannellum) { clearInterval(check); resolve(); } }, 50);
    }
  });
}

export default function PannellumViewer({
  imagePath,
  previewPath,
  hotspots = [],
  initialYaw = 0,
  initialPitch = 0,
  initialHfov = 100,
}: PannellumViewerProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef      = useRef<any>(null);
  const animFrameRef   = useRef<number>(0);
  const labelRefs      = useRef<(HTMLDivElement | null)[]>([]);

  const buildHotspotElement = useCallback((hs: VrHotspot, index: number): HTMLDivElement => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position:absolute; transform:translate(-50%,-50%);
      pointer-events:none; will-change:opacity,transform;
      opacity:0; transition:opacity 0.45s cubic-bezier(.4,0,.2,1),transform 0.45s cubic-bezier(.4,0,.2,1);
    `;
    const bubble = document.createElement('div');
    bubble.style.cssText = `
      display:flex; align-items:center; gap:6px;
      background:rgba(0,0,0,0.72); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
      border:1px solid rgba(255,255,255,0.18); border-radius:24px; padding:7px 14px 7px 10px;
      color:#fff; font-family:'Inter','Outfit',sans-serif; font-size:13px; font-weight:600;
      letter-spacing:0.3px; white-space:nowrap;
      box-shadow:0 4px 24px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.06); user-select:none;
    `;
    if (hs.icon) {
      const icon = document.createElement('span');
      icon.style.cssText = 'font-size:15px;line-height:1;';
      icon.textContent = hs.icon;
      bubble.appendChild(icon);
    }
    const dot = document.createElement('span');
    dot.style.cssText = `width:7px;height:7px;background:#4ade80;border-radius:50%;flex-shrink:0;box-shadow:0 0 6px #4ade80;`;
    bubble.appendChild(dot);
    const text = document.createElement('span');
    text.textContent = hs.label;
    bubble.appendChild(text);
    wrapper.appendChild(bubble);
    labelRefs.current[index] = wrapper;
    return wrapper;
  }, []);

  const startFadeLoop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const tick = () => {
      if (!viewerRef.current) return;
      try {
        const camYaw   = viewerRef.current.getYaw();
        const camPitch = viewerRef.current.getPitch();
        hotspots.forEach((hs, i) => {
          const el = labelRefs.current[i];
          if (!el) return;
          const dist = angularDistance(camYaw, camPitch, hs.yaw, hs.pitch);
          const visible = hs.visibleRadius ?? 25;
          const fade    = hs.fadeRadius    ?? 40;
          let opacity = 0;
          if (dist <= visible) opacity = 1;
          else if (dist < fade) opacity = 1 - (dist - visible) / (fade - visible);
          el.style.opacity = opacity.toFixed(3);
          const scale = 0.88 + opacity * 0.12;
          el.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;
        });
      } catch { /* viewer not ready */ }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [hotspots]);

  useEffect(() => {
    let destroyed = false;
    const init = async () => {
      await injectPannellumAssets();
      if (destroyed || !containerRef.current) return;
      const pannellumHotspots = hotspots.map((hs, i) => ({
        type: 'custom',
        pitch: hs.pitch,
        yaw: hs.yaw,
        cssClass: 'pnl-hs',
        createTooltipFunc: () => buildHotspotElement(hs, i),
      }));
      viewerRef.current = window.pannellum.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: imagePath,
        preview: previewPath,
        autoLoad: true,
        autoRotate: -1.5,
        autoRotateInactivityDelay: 3000,
        compass: false,
        showZoomCtrl: false,
        showFullscreenCtrl: false,
        showControls: false,
        mouseZoom: true,
        friction: 0.3,
        yaw: initialYaw,
        pitch: initialPitch,
        hfov: initialHfov,
        minHfov: 50,
        maxHfov: 120,
        hotSpots: pannellumHotspots,
      });
      setTimeout(() => { if (!destroyed) startFadeLoop(); }, 600);
    };
    init();
    return () => {
      destroyed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (viewerRef.current) { try { viewerRef.current.destroy(); } catch { /* ignore */ } viewerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#0a0a0a', borderRadius:'inherit', overflow:'hidden' }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
      <style>{`
        .pnl-compass,.pnl-about-msg,.pnl-hotspot-debug-msg { display:none!important; }
        .pannellum-container { background:#0a0a0a!important; }
        .pnl-hs { background:none!important; border:none!important; }
        .pnl-hs::after { display:none!important; }
      `}</style>
    </div>
  );
}
