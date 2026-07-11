'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Plot, Enquiry, PlotStatus } from '@/types';

interface AppContextType {
  plots: Plot[];
  enquiries: Enquiry[];
  selectedPlot: Plot | null;
  hoveredPlot: string | null;
  filterStatus: PlotStatus | 'all';
  searchQuery: string;
  isLoading: boolean;

  setSelectedPlot: (plot: Plot | null) => void;
  setHoveredPlot: (id: string | null) => void;
  setFilterStatus: (status: PlotStatus | 'all') => void;
  setSearchQuery: (q: string) => void;
  updatePlotStatus: (plotId: string, status: PlotStatus) => void;
  updatePlot: (plotId: string, updates: Partial<Plot>) => void;
  addPlot: (siteId: string) => string;
  deletePlot: (plotId: string) => void;
  deleteAllPlots: (siteId: string) => void;
  addEnquiry: (enquiry: Omit<Enquiry, 'id' | 'date'>) => void;
  getStats: () => { available: number; sold: number; reserved: number; total: number };
  filteredPlots: Plot[];
  siteSlug: string;
}

const AppContext = createContext<AppContextType | null>(null);

// ── API helpers (surgical — one row at a time) ──────────────────────────────

async function apiFetchPlots(siteSlug: string): Promise<Plot[] | null> {
  try {
    const res = await fetch(`/api/plots?site=${siteSlug}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

async function apiUpsertPlot(plot: Plot, siteSlug: string): Promise<void> {
  try {
    await fetch(`/api/plots?site=${siteSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plot),
    });
  } catch {
    // Silent fail — optimistic update already applied in UI
  }
}

async function apiDeletePlot(id: string, siteSlug: string): Promise<void> {
  try {
    await fetch(`/api/plots/${id}?site=${siteSlug}`, { method: 'DELETE' });
  } catch {
    // Silent fail
  }
}

async function apiDeleteAllPlots(siteSlug: string): Promise<void> {
  try {
    await fetch(`/api/plots?site=${siteSlug}`, { method: 'DELETE' });
  } catch {
    // Silent fail
  }
}

async function apiFetchEnquiries(siteSlug: string): Promise<Enquiry[] | null> {
  try {
    const res = await fetch(`/api/enquiries?site=${siteSlug}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

async function apiSaveEnquiry(enquiry: Enquiry, siteSlug: string): Promise<void> {
  try {
    await fetch(`/api/enquiries?site=${siteSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiry),
    });
  } catch {
    // Silent fail
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children, siteSlug }: { children: React.ReactNode, siteSlug: string }) {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedPlot, setSelectedPlotState] = useState<Plot | null>(null);
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PlotStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);


  // Load plots from Supabase on mount
  useEffect(() => {
    setIsLoading(true);
    apiFetchPlots(siteSlug).then(data => {
      if (data !== null) setPlots(data);
      setIsLoading(false);
    });
  }, [siteSlug]);

  // Load enquiries (In a real app, only if admin, but here we just load them)
  useEffect(() => {
    apiFetchEnquiries(siteSlug).then(data => {
      if (data !== null) setEnquiries(data);
    });
  }, [siteSlug]);

  const setSelectedPlot = useCallback((plot: Plot | null) => {
    setSelectedPlotState(plot);
  }, []);

  // ── Mutations — optimistic UI update + Supabase write ───────────────────

  const updatePlotStatus = useCallback((plotId: string, status: PlotStatus) => {
    setPlots(prev => {
      const next = prev.map(p => p.id === plotId ? { ...p, status } : p);
      const updated = next.find(p => p.id === plotId);
      if (updated) apiUpsertPlot(updated, siteSlug);
      return next;
    });
    setSelectedPlotState(prev => prev?.id === plotId ? { ...prev, status } : prev);
  }, [siteSlug]);

  const updatePlot = useCallback((plotId: string, updates: Partial<Plot>) => {
    setPlots(prev => {
      const next = prev.map(p => p.id === plotId ? { ...p, ...updates } : p);
      const updated = next.find(p => p.id === plotId);
      if (updated) apiUpsertPlot(updated, siteSlug);
      return next;
    });
    setSelectedPlotState(prev => prev?.id === plotId ? { ...prev, ...updates } : prev);
  }, [siteSlug]);

  const addPlot = useCallback((siteId: string) => {
    const newId = `new-plot-${Date.now()}`;
    const newPlot: Plot = {
      id: newId,
      number: 999,
      label: 'New Plot',
      x: 0, y: 0, width: 0, height: 0,
      sizeSqFt: 1000,
      sizeSqM: 93,
      facing: 'East',
      phase: 'N/A',
      price: 1500000,
      status: 'available',
      type: 'N/A',
      // site_id will be injected by the backend based on siteSlug
    };
    setPlots(prev => {
      apiUpsertPlot(newPlot, siteSlug);
      return [newPlot, ...prev];
    });
    return newId;
  }, [siteSlug]);

  const deletePlot = useCallback((plotId: string) => {
    setPlots(prev => prev.filter(p => p.id !== plotId));
    setSelectedPlotState(prev => prev?.id === plotId ? null : prev);
    apiDeletePlot(plotId, siteSlug);
  }, [siteSlug]);

  const deleteAllPlots = useCallback(() => {
    setPlots([]);
    setSelectedPlotState(null);
    apiDeleteAllPlots(siteSlug);
  }, [siteSlug]);

  const addEnquiry = useCallback((enquiry: Omit<Enquiry, 'id' | 'date'>) => {
    const newEnquiry: Enquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setEnquiries(prev => [newEnquiry, ...prev]);
    apiSaveEnquiry(newEnquiry, siteSlug);
  }, [siteSlug]);

  const getStats = useCallback(() => ({
    available: plots.filter(p => p.status === 'available').length,
    sold:      plots.filter(p => p.status === 'sold').length,
    reserved:  plots.filter(p => p.status === 'reserved').length,
    total:     plots.length,
  }), [plots]);

  const filteredPlots = plots.filter(plot => {
    if (filterStatus !== 'all' && plot.status !== filterStatus) return false;
    if (searchQuery) return plot.label.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  return (
    <AppContext.Provider value={{
      plots, enquiries, selectedPlot, hoveredPlot,
      filterStatus, searchQuery, isLoading,
      setSelectedPlot, setHoveredPlot, setFilterStatus, setSearchQuery,
      updatePlotStatus, updatePlot, addPlot, deletePlot, deleteAllPlots,
      addEnquiry, getStats, filteredPlots, siteSlug,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
