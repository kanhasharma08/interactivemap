'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { getSiteConfig } from '@/data/sites';

export default function AdminMapper({ plotId, onCancel, onSave }: { plotId: string; onCancel: () => void; onSave: () => void }) {
  const { plots, updatePlot, siteSlug } = useApp();
  const siteConfig = getSiteConfig(siteSlug);
  const SVG_W = siteConfig.svgW;
  const SVG_H = siteConfig.svgH;

  // For remapping, use the original (previous) map image variant if it exists, so that bounds match up perfectly
  const originalVariant = siteConfig.mapVariants?.find(v => v.id === 'original');
  const mapImage = originalVariant?.mapImage ?? siteConfig.mapImage;

  const plot = plots.find(p => p.id === plotId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  // Polygon drawing state
  const [drawMode, setDrawMode] = useState<'rect' | 'polygon'>('rect');
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Rotation state
  const [rotation, setRotation] = useState(0);
  
  // Panning state
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  // Initialize scale to fit screen
  useEffect(() => {
    let hasFitted = false;
    const fit = () => {
      if (!containerRef.current || hasFitted) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      
      const scaleX = width / SVG_W;
      const scaleY = height / SVG_H;
      const scale = Math.max(0.02, Math.min(scaleX, scaleY) * 0.95);
      const x = (width - SVG_W * scale) / 2;
      const y = (height - SVG_H * scale) / 2;
      setTransform({ x, y, scale });
      hasFitted = true;
    };
    
    fit();
    
    const observer = new ResizeObserver(() => fit());
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  const getSvgCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - transform.x) / transform.scale;
    const y = (clientY - rect.top - transform.y) / transform.scale;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+Left click to pan
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button !== 0) return; // only left click for drawing
    const coords = getSvgCoords(e.clientX, e.clientY);
    
    if (drawMode === 'rect') {
      setStartPos(coords);
      setIsDrawing(true);
      setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
    } else {
      // Polygon mode: add point
      setPolygonPoints(prev => [...prev, coords]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const coords = getSvgCoords(e.clientX, e.clientY);
    setMousePos(coords);
    
    if (drawMode === 'rect' && isDrawing) {
      setCurrentBox({
        x: Math.min(startPos.x, coords.x),
        y: Math.min(startPos.y, coords.y),
        w: Math.abs(coords.x - startPos.x),
        h: Math.abs(coords.y - startPos.y),
      });
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    if (drawMode === 'rect' && isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (drawMode === 'polygon' && polygonPoints.length > 2) {
      // Could auto-close polygon here if we want, but we just let them click "Save Mapping"
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1 + (-e.deltaY * 0.001) * 1.5;
    setTransform(prev => {
      const newScale = Math.max(0.05, Math.min(10, prev.scale * zoomFactor));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return prev;
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      return { x: mx - (mx - prev.x) * (newScale / prev.scale), y: my - (my - prev.y) * (newScale / prev.scale), scale: newScale };
    });
  };

  const handleSave = () => {
    if (drawMode === 'rect' && currentBox && plot) {
      updatePlot(plot.id, { 
        x: currentBox.x, 
        y: currentBox.y, 
        width: currentBox.w, 
        height: currentBox.h,
        points: undefined // clear points if switched back to rect
      });
      onSave();
    } else if (drawMode === 'polygon' && polygonPoints.length >= 3 && plot) {
      // Calculate bounding box for the polygon so label centering still works
      const xs = polygonPoints.map(p => p.x);
      const ys = polygonPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      const pointsStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');
      
      updatePlot(plot.id, {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        points: pointsStr
      });
      onSave();
    }
  };

  const polygonPath = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');

  if (!plot) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f172a', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'white' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Map Plot: {plot.label}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Scroll to zoom. Middle-click (or Shift+Click) and drag to pan. Click and drag to draw plot area.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <span style={{ color: 'white', fontSize: 13 }}>Mode:</span>
            <select 
              value={drawMode} 
              onChange={e => { setDrawMode(e.target.value as any); setPolygonPoints([]); setCurrentBox(null); }}
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 4 }}
            >
              <option value="rect">Rectangle</option>
              <option value="polygon">Polygon</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <span style={{ color: 'white', fontSize: 13 }}>Rotate:</span>
            <input type="range" min="-180" max="180" value={rotation} onChange={e => setRotation(Number(e.target.value))} style={{ width: 80 }} />
            <input type="number" value={rotation} onChange={e => setRotation(Number(e.target.value))} style={{ width: 60, background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px', borderRadius: 4, fontSize: 13 }} />
          </div>
          <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={drawMode === 'rect' ? (!currentBox || currentBox.w < 5) : polygonPoints.length < 3}>
            Save Mapping
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}>
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div style={{ position: 'relative', width: SVG_W, height: SVG_H, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: `rotate(${rotation}deg)`, transformOrigin: 'center center' }}>
              <img src={mapImage} style={{ width: '100%', height: '100%', pointerEvents: 'none', imageRendering: (mapImage.endsWith('.svg') ? 'auto' : 'high-quality') as any }} alt={`${siteConfig.name} Map`} />
            </div>
            <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', transform: `rotate(${rotation}deg)`, transformOrigin: 'center center' }}>
              {/* Show already mapped plots faintly */}
              {plots.filter(p => p.id !== plot.id).map(p => (
                p.points ? (
                  <polygon key={p.id} points={p.points} fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth={1} />
                ) : p.path ? (
                  <path key={p.id} d={p.path} fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth={1} />
                ) : (
                  <rect key={p.id} x={p.x} y={p.y} width={p.width} height={p.height} fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth={1} />
                )
              ))}
              
              {/* Draw current box */}
              {drawMode === 'rect' && currentBox && (
                <rect
                  x={currentBox.x}
                  y={currentBox.y}
                  width={currentBox.w}
                  height={currentBox.h}
                  fill="rgba(34,197,94,0.3)"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
              )}

              {/* Draw current polygon */}
              {drawMode === 'polygon' && (
                <>
                  {polygonPoints.length > 0 && (
                    <polygon
                      points={polygonPath + (mousePos ? ` ${mousePos.x},${mousePos.y}` : '')}
                      fill="rgba(34,197,94,0.3)"
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                  )}
                  {polygonPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={4 / transform.scale} fill="white" stroke="#22c55e" strokeWidth={2 / transform.scale} />
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
