export type PlotStatus = 'available' | 'sold' | 'reserved' | 'N/A';
export type PlotFacing = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West' | 'N/A';
export type PlotType = 'Residential' | 'Premium' | 'Mortgage' | 'Amenity' | 'N/A' | (string & {});
export type OpenSpaceType = 'park' | 'garden' | 'amenity' | 'multipurpose';

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Plot {
  id: string;
  number: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sizeSqFt: number;
  sizeSqM: number;
  areaText?: string;       // free-form area description e.g. "30×50 ft", "200 sq.yd"
  facing: PlotFacing;
  type: PlotType;
  price: number;
  status: PlotStatus;
  phase: 12 | 13 | 'N/A';
  description?: string;
  bounds?: Bounds;
  points?: string;
  path?: string;
  hero_images?: string[];  // Supabase Storage URLs — set by admin or migration script
}

export interface OpenSpace {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: OpenSpaceType;
  amenities?: string[];
  area?: string;
  bounds?: Bounds;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  plotId: string;
  plotLabel: string;
  date: string;
  message?: string;
  source: 'website' | 'whatsapp' | 'visit';
}

export interface MapViewState {
  x: number;
  y: number;
  scale: number;
}
