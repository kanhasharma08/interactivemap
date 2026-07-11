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
    case 'sold': return '#ef4444';
    case 'reserved': return '#f97316';
    case 'N/A': return '#94a3b8';
    default: return '#94a3b8';
  }
}

export function getStatusBg(status: Plot['status']): string {
  switch (status) {
    case 'available': return 'rgba(34,197,94,0.18)';
    case 'sold': return 'rgba(239,68,68,0.18)';
    case 'reserved': return 'rgba(249,115,22,0.18)';
    case 'N/A': return 'rgba(148,163,184,0.18)';
    default: return 'rgba(148,163,184,0.18)';
  }
}
