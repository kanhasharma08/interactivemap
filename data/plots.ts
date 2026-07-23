import { Plot, OpenSpace } from '@/types';

export const PLOTS: Plot[] = [];

export const OPEN_SPACES: OpenSpace[] = [];

export function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export function getStatusColor(status: Plot['status']): string {
  switch (status) {
    case 'available': return '#22c55e';
    case 'sold': return '#eab308';
    case 'reserved': return '#eab308';
    case 'N/A': return '#94a3b8';
    default: return '#94a3b8';
  }
}

export function getStatusBg(status: Plot['status']): string {
  switch (status) {
    case 'available': return 'rgba(34,197,94,0.18)';
    case 'sold': return 'rgba(234,179,8,0.18)';
    case 'reserved': return 'rgba(234,179,8,0.18)';
    case 'N/A': return 'rgba(148,163,184,0.18)';
    default: return 'rgba(148,163,184,0.18)';
  }
}

/** Dot colour on the map: Mortgage type → red, else status-based */
export function getPlotDotColor(type: Plot['type'], status: Plot['status']): string {
  if (type === 'Mortgage') return '#ef4444';
  return getStatusColor(status);
}
