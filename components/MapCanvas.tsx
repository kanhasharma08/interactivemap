'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/context';
import { PLOTS, OPEN_SPACES, getStatusColor, getStatusBg } from '@/data/plots';
import { Plot, OpenSpace } from '@/types';
import { getSiteConfig } from '@/data/sites';

// SVG dimensions are now per-site via getSiteConfig()

// Label visibility threshold
const LABEL_SCALE_THRESHOLD = 0.9;

// Touch gesture constants
const MIN_PINCH_DIST = 15;            // px — ignore tiny initial distance to avoid explosive zoom
const MAX_ZOOM_PER_FRAME = 1.15;      // max scale change per touchmove event

interface TooltipState {
  x: number; y: number;
  label: string;
  status: string;
  visible: boolean;
}

interface PlotCellProps {
  plot: Plot;
  isFiltered: boolean;
  isSelected: boolean;
  onSelect: (plot: Plot) => void;
  onTooltip: (t: TooltipState) => void;
  dragRef: React.MutableRefObject<{ moved: boolean }>;
}

const PlotCell = memo(function PlotCell({ plot, isFiltered, isSelected, onSelect, onTooltip, dragRef }: PlotCellProps) {
  const typeColor = plot.type === 'Premium' ? '#eab308' : plot.type === 'Mortgage' ? '#ef4444' : plot.type === 'Amenity' ? '#8b5cf6' : plot.type === 'N/A' ? '#64748b' : '#94a3b8';
  const typeBg   = plot.type === 'Premium' ? 'rgba(234,179,8,0.15)' : plot.type === 'Mortgage' ? 'rgba(239,68,68,0.15)' : plot.type === 'Amenity' ? 'rgba(139,92,246,0.15)' : plot.type === 'N/A' ? 'rgba(100,116,139,0.15)' : 'rgba(148,163,184,0.08)';
  const opacity = isFiltered ? 1 : 0.2;
  const cx = plot.x + plot.width / 2;
  const cy = plot.y + plot.height / 2;
  const fontSize = Math.max(12, Math.min(plot.width, plot.height) * 0.22);

  const downPos = useRef<{x: number, y: number, time: number} | null>(null);

  return (
    <g
      className={`plot-group ${isSelected ? 'selected' : ''}`}
      style={{ 
        cursor: 'pointer', opacity, pointerEvents: 'all',
        '--type-color': typeColor,
        '--type-bg': typeBg,
      } as React.CSSProperties}
      onPointerEnter={(e) => { 
        if (e.pointerType === 'mouse') {
          onTooltip({ x: e.clientX + 14, y: e.clientY - 10, label: `${plot.label} (${plot.type})`, status: plot.type === 'Amenity' ? ('' as any) : plot.status, visible: true }); 
        }
      }}
      onPointerMove={(e) => { 
        if (e.pointerType === 'mouse') {
          onTooltip({ x: e.clientX + 14, y: e.clientY - 10, label: `${plot.label} (${plot.type})`, status: plot.status, visible: true }); 
        }
      }}
      onPointerLeave={(e) => { 
        downPos.current = null;
        if (e.pointerType === 'mouse') {
          onTooltip({ x: 0, y: 0, label: '', status: '', visible: false }); 
        }
      }}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      }}
      onPointerUp={(e) => {
        if (!downPos.current) return;
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        const dt = Date.now() - downPos.current.time;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 600) {
          onSelect(plot);
        }
        downPos.current = null;
      }}
    >
      {plot.points ? (
        <polygon className="plot-shape" points={plot.points} style={{ fill: typeBg }} />
      ) : plot.path ? (
        <path className="plot-shape" d={plot.path} style={{ fill: typeBg }} />
      ) : (
        <rect className="plot-shape" x={plot.x} y={plot.y} width={plot.width} height={plot.height} rx={4} style={{ fill: typeBg }} />
      )}
      
      {plot.points ? (
        <polygon className="plot-outline" points={plot.points} />
      ) : plot.path ? (
        <path className="plot-outline" d={plot.path} />
      ) : (
        <rect className="plot-outline" x={plot.x - 3} y={plot.y - 3} width={plot.width + 6} height={plot.height + 6} rx={7} />
      )}
      
      <text className="plot-label" x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fontWeight="700">
        {plot.label}
      </text>
    </g>
  );
});

const OpenSpaceCell = memo(function OpenSpaceCell({ os, onSelect }: { os: OpenSpace; onSelect: (os: OpenSpace) => void }) {
  const [hovered, setHovered] = useState(false);
  const downPos = useRef<{x: number, y: number, time: number} | null>(null);
  
  if (!os.x && os.x !== 0) return null;
  
  const typeColors = {
    park:         { fill: 'rgba(34,197,94,0.14)',   stroke: '#22c55e' },
    garden:       { fill: 'rgba(134,239,172,0.16)', stroke: '#4ade80' },
    amenity:      { fill: 'rgba(59,130,246,0.12)',  stroke: '#60a5fa' },
    multipurpose: { fill: 'rgba(168,85,247,0.12)',  stroke: '#c084fc' },
  };
  const colors = typeColors[os.type];
  return (
    <g
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={(e) => { 
        downPos.current = null;
        if (e.pointerType === 'mouse') setHovered(false); 
      }}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      }}
      onPointerUp={(e) => {
        if (!downPos.current) return;
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        const dt = Date.now() - downPos.current.time;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 600) {
          onSelect(os);
        }
        downPos.current = null;
      }}
    >
      <rect
        x={os.x} y={os.y} width={os.width} height={os.height}
        fill={hovered ? colors.fill.replace(/0\.\d+\)/, '0.28)') : colors.fill}
        stroke={colors.stroke}
        strokeWidth={hovered ? 3 : 2}
        strokeDasharray={hovered ? 'none' : '8,5'}
        rx={8}
      />
    </g>
  );
});

interface MapCanvasProps {
  onOpenSpaceSelect: (os: OpenSpace) => void;
}

export default function MapCanvas({ onOpenSpaceSelect }: MapCanvasProps) {
  const { plots, filteredPlots, selectedPlot, setSelectedPlot, siteSlug } = useApp();
  const siteConfig = getSiteConfig(siteSlug);
  const SVG_W = siteConfig.svgW;
  const SVG_H = siteConfig.svgH;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Map variant switcher — defaults to siteConfig.mapImage
  const [activeMapImage, setActiveMapImage] = useState(siteConfig.mapImage);
  const mapVariants = siteConfig.mapVariants;
  // Derive active variant
  const activeVariant = mapVariants?.find(v => v.mapImage === activeMapImage);

  // Custom calibration states so they can be tweaked interactively
  const [calibOffsetX, setCalibOffsetX] = useState(0);
  const [calibOffsetY, setCalibOffsetY] = useState(0);
  const [calibScaleX, setCalibScaleX] = useState(1);
  const [calibScaleY, setCalibScaleY] = useState(1);
  const [showCalib, setShowCalib] = useState(false);

  // Sync state when active map variant changes
  useEffect(() => {
    if (activeVariant) {
      setCalibOffsetX(activeVariant.offsetX ?? 0);
      setCalibOffsetY(activeVariant.offsetY ?? 0);
      setCalibScaleX(activeVariant.scaleX ?? 1);
      setCalibScaleY(activeVariant.scaleY ?? 1);
    } else {
      setCalibOffsetX(0);
      setCalibOffsetY(0);
      setCalibScaleX(1);
      setCalibScaleY(1);
    }
  }, [activeVariant]);

  // Transform stored in ref — never causes React re-renders during gestures
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });

  // Only 3 pieces of state that actually need React renders:
  // 1. showLabel: toggles only when crossing LABEL_SCALE_THRESHOLD
  // 2. zoomBadge: displayed scale % (updated via rAF, low priority)
  // 3. rotation, tooltip, fullscreen
  const [showLabel, setShowLabel] = useState(false);
  const [zoomBadge, setZoomBadge] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tooltip is mutated directly via DOM ref — zero React re-renders on mouse-move
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipVisible = useRef(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const dragRef = useRef({ active: false, startX: 0, startY: 0, tx: 0, ty: 0, moved: false });
  const TOUCH_MOVE_THRESHOLD = 8;
  const MOUSE_MOVE_THRESHOLD = 3;

  // Track last committed scale for threshold comparison
  const lastLabelScale = useRef(0);
  // Badge update timer
  const badgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After gesture ends, update badge and check label threshold
  const onGestureEnd = useCallback(() => {
    const s = transformRef.current.scale;
    // Update badge lazily (100ms after gesture ends)
    if (badgeTimer.current) clearTimeout(badgeTimer.current);
    badgeTimer.current = setTimeout(() => setZoomBadge(Math.round(s * 100)), 100);
    // Only re-render plots if label visibility crossed threshold
    const wasAbove = lastLabelScale.current > LABEL_SCALE_THRESHOLD;
    const isAbove  = s > LABEL_SCALE_THRESHOLD;
    if (wasAbove !== isAbove) {
      setShowLabel(isAbove);
    }
    lastLabelScale.current = s;
  }, []);

  // rAF batch — direct DOM mutation, zero React involvement
  const rafId = useRef<number | null>(null);
  const applyTransform = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const { x, y, scale } = transformRef.current;
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      }
    });
  }, []);

  const filteredIds = useMemo(() => new Set(filteredPlots.map(p => p.id)), [filteredPlots]);

  // Android Chrome checks the ENTIRE ancestor chain for touch-action.
  // Setting it only on .map-viewport is not enough — must also set on <html>.
  useEffect(() => {
    const html = document.documentElement;
    const prevTouchAction = html.style.touchAction;
    const prevOverscroll = html.style.overscrollBehavior;
    html.style.touchAction = 'none';
    html.style.overscrollBehavior = 'none';

    // Fallback: block any touch scroll that reaches document level
    const blockDocTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('touchmove', blockDocTouch, { passive: false });

    return () => {
      html.style.touchAction = prevTouchAction;
      html.style.overscrollBehavior = prevOverscroll;
      document.removeEventListener('touchmove', blockDocTouch);
    };
  }, []);

  useEffect(() => {
    let hasFitted = false;
    const fit = () => {
      if (!containerRef.current || hasFitted) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const s = Math.max(0.02, Math.min(width / SVG_W, height / SVG_H) * 0.95);
      const nx = (width - SVG_W * s) / 2;
      const ny = (height - SVG_H * s) / 2;
      transformRef.current = { x: nx, y: ny, scale: s };
      applyTransform();
      lastLabelScale.current = s;
      setZoomBadge(Math.round(s * 100));
      setShowLabel(s > LABEL_SCALE_THRESHOLD);
      hasFitted = true;
    };
    fit();
    const observer = new ResizeObserver(() => fit());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [applyTransform]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1 + (-e.deltaY * 0.001) * 1.5;
    const prev = transformRef.current;
    const newScale = Math.max(0.05, Math.min(10, prev.scale * zoomFactor));
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    transformRef.current = {
      x: mx - (mx - prev.x) * (newScale / prev.scale),
      y: my - (my - prev.y) * (newScale / prev.scale),
      scale: newScale,
    };
    applyTransform();
    onGestureEnd();
  }, [applyTransform, onGestureEnd]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    const { x, y } = transformRef.current;
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, tx: x, ty: y, moved: false };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    if (e.pointerType === 'touch') return; // touch handled separately
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      dragRef.current.active = false;
      return;
    }
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > MOUSE_MOVE_THRESHOLD || Math.abs(dy) > MOUSE_MOVE_THRESHOLD) dragRef.current.moved = true;
    transformRef.current = { ...transformRef.current, x: dragRef.current.tx + dx, y: dragRef.current.ty + dy };
    applyTransform();
  }, [applyTransform]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // touch handled by touchend
    dragRef.current.active = false;
    onGestureEnd();
  }, [onGestureEnd]);

  const lastTouch = useRef<{ x: number; y: number; dist: number } | null>(null);
  const containerRectRef = useRef<{ left: number; top: number } | null>(null);
  const isPinching = useRef(false); // suppresses hover/tooltip state during active pinch

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Capture rect once on touch start — NOT inside touchmove (avoid layout thrashing)
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) containerRectRef.current = { left: rect.left, top: rect.top };

    if (e.touches.length === 1) {
      isPinching.current = false;
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
      const { x, y } = transformRef.current;
      dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, tx: x, ty: y, moved: false };
    } else if (e.touches.length === 2) {
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
      dragRef.current.moved = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!lastTouch.current) return;
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 1) {
      isPinching.current = false;
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      if (Math.abs(dx) > TOUCH_MOVE_THRESHOLD || Math.abs(dy) > TOUCH_MOVE_THRESHOLD) {
        dragRef.current.moved = true;
      }
      if (dragRef.current.moved) {
        transformRef.current = { ...transformRef.current, x: dragRef.current.tx + dx, y: dragRef.current.ty + dy };
        applyTransform();
        lastTouch.current = { ...lastTouch.current, x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    } else if (e.touches.length === 2) {
      isPinching.current = true;
      // Use cached rect from touchstart — never call getBoundingClientRect in touchmove!
      const rect = containerRectRef.current;
      if (!rect) return;

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      if (lastTouch.current.dist >= MIN_PINCH_DIST && dist >= MIN_PINCH_DIST) {
        const rawFactor = dist / lastTouch.current.dist;
        const zoomFactor = Math.max(1 / MAX_ZOOM_PER_FRAME, Math.min(MAX_ZOOM_PER_FRAME, rawFactor));

        const cmx = mx - rect.left;
        const cmy = my - rect.top;
        const old_cmx = lastTouch.current.x - rect.left;
        const old_cmy = lastTouch.current.y - rect.top;

        const prev = transformRef.current;
        const newScale = Math.max(0.05, Math.min(3, prev.scale * zoomFactor)); // max 3x on mobile

        if (!isFinite(newScale) || newScale <= 0) {
          lastTouch.current = { x: mx, y: my, dist };
          return;
        }

        transformRef.current = {
          x: cmx - (old_cmx - prev.x) * (newScale / prev.scale),
          y: cmy - (old_cmy - prev.y) * (newScale / prev.scale),
          scale: newScale,
        };
        applyTransform();
      }

      lastTouch.current = { x: mx, y: my, dist };
    }
  }, [applyTransform]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) {
      isPinching.current = false;
      lastTouch.current = null;
      dragRef.current.active = false;
      onGestureEnd();
    } else if (e.touches.length === 1) {
      isPinching.current = false;
      // Pinch → pan transition: reset tracking
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
      const { x, y } = transformRef.current;
      dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, tx: x, ty: y, moved: true };
    }
  }, [onGestureEnd]);

  // Bind non-passive touch listeners to prevent iOS Safari from crashing/reloading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Safari proprietary gesture events (pinch to zoom)
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Stop Safari from triggering native pinch-zoom on fast gestures
    el.addEventListener('gesturestart', preventGesture, { passive: false });
    el.addEventListener('gesturechange', preventGesture, { passive: false });
    el.addEventListener('gestureend', preventGesture, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);

      el.removeEventListener('gesturestart', preventGesture);
      el.removeEventListener('gesturechange', preventGesture);
      el.removeEventListener('gestureend', preventGesture);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const zoom = useCallback((delta: number) => {
    const prev = transformRef.current;
    const newScale = Math.max(0.05, Math.min(10, prev.scale * (1 + delta)));
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2, cy = rect.height / 2;
    transformRef.current = {
      x: cx - (cx - prev.x) * (newScale / prev.scale),
      y: cy - (cy - prev.y) * (newScale / prev.scale),
      scale: newScale,
    };
    applyTransform();
    onGestureEnd();
  }, [applyTransform, onGestureEnd]);

  const resetView = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const s = Math.max(0.02, Math.min(width / SVG_W, height / SVG_H) * 0.92);
    transformRef.current = { x: (width - SVG_W * s) / 2, y: (height - SVG_H * s) / 2, scale: s };
    applyTransform();
    setZoomBadge(Math.round(s * 100));
    setShowLabel(s > LABEL_SCALE_THRESHOLD);
    lastLabelScale.current = s;
    setRotation(0);
  }, [applyTransform]);

  // Direct DOM mutation — never triggers a React render on mouse-move
  const handleTooltip = useCallback((t: TooltipState) => {
    if (isPinching.current) return;
    const el = tooltipRef.current;
    if (!el) return;
    if (t.visible) {
      el.style.left = `${t.x}px`;
      el.style.top  = `${t.y}px`;
      if (!tooltipVisible.current) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'none';
        tooltipVisible.current = true;
      }
      // Update text nodes directly — no reconciliation cost
      const labelEl = el.querySelector<HTMLElement>('.tooltip-label');
      const statusEl = el.querySelector<HTMLElement>('.tooltip-status-inner');
      if (labelEl) labelEl.textContent = t.label;
      if (statusEl) {
        statusEl.textContent = t.status || '';
        statusEl.style.display = t.status ? '' : 'none';
      }
    } else {
      if (tooltipVisible.current) {
        el.style.opacity = '0';
        tooltipVisible.current = false;
      }
    }
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', contain: 'strict' }}>
      <div
        ref={containerRef}
        className="map-viewport"
        style={{ width: '100%', height: '100%', touchAction: 'none', contain: 'strict' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          ref={canvasRef}
          className="map-canvas"
          style={{
            transformOrigin: '0 0',
            position: 'relative',
            width: SVG_W,
            height: SVG_H,
            // Promote the entire canvas to its own GPU compositor layer.
            // This means pan/zoom only triggers a composite step — no paint or layout.
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          <div style={{ width: '100%', height: '100%', transform: `rotate(${rotation}deg) translateZ(0)`, transformOrigin: 'center center', position: 'relative' }}>
            <img
              ref={imgRef}
              src={activeMapImage}
              alt={`${siteConfig.name} Map Layout`}
              draggable={false}
              style={{
                display: 'block',
                width: Math.round(SVG_W * calibScaleX),
                height: Math.round(SVG_H * calibScaleY),
                pointerEvents: 'none',
                userSelect: 'none',
                transform: `translate(${Math.round(calibOffsetX)}px, ${Math.round(calibOffsetY)}px) translateZ(0)`,
              }}
            />
            <svg
              ref={svgRef}
              width={SVG_W}
              height={SVG_H}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{
                position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
                // SVG on its own compositor layer so plot highlights don't repaint the image
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            >
              <g style={{ pointerEvents: 'all' }}>
                {OPEN_SPACES.map(os => (
                  <OpenSpaceCell key={os.id} os={os} onSelect={onOpenSpaceSelect} />
                ))}
                {plots.map(plot => (
                  <PlotCell
                    key={plot.id}
                    plot={plot}
                    isFiltered={filteredIds.has(plot.id)}
                    isSelected={selectedPlot?.id === plot.id}
                    onSelect={setSelectedPlot}
                    onTooltip={handleTooltip}
                    dragRef={dragRef}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <button className="toolbar-btn" onClick={() => zoom(0.3)} title="Zoom In">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => zoom(-0.3)} title="Zoom Out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <div className="zoom-badge">{zoomBadge}%</div>
        <div className="toolbar-divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
          <input
            type="range" min="-180" max="180" value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            style={{ width: 80, cursor: 'pointer', accentColor: 'var(--accent)' }}
            title="Rotate Map"
          />
        </div>
        {mapVariants && mapVariants.length > 1 && (
          <>
            <div className="toolbar-divider" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Switch Map Layer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <select
                value={activeMapImage}
                onChange={(e) => setActiveMapImage(e.target.value)}
                style={{
                  background: 'var(--panel-bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  outline: 'none',
                  maxWidth: 130,
                }}
                title="Switch map layer"
              >
                {mapVariants.map(v => (
                  <option key={v.id} value={v.mapImage}>{v.label}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={resetView} title="Reset View">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
          </svg>
        </button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={() => {
          if (!isFullscreen) { containerRef.current?.closest('.map-root')?.requestFullscreen?.(); setIsFullscreen(true); }
          else { document.exitFullscreen?.(); setIsFullscreen(false); }
        }} title="Fullscreen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
            <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
          </svg>
        </button>
      </div>



      {/* Tooltip: DOM-mutated directly for zero React overhead on every mouse-move */}
      <div
        ref={tooltipRef}
        className="map-tooltip"
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 200,
          opacity: 0, transition: 'opacity 0.08s ease',
          // Pre-created, always in DOM — shown/hidden via opacity only
        }}
      >
        <div className="tooltip-label"></div>
        <div className="tooltip-status-inner" style={{ display: 'none' }}></div>
      </div>
    </div>
  );
}
