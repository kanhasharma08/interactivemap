// Site configuration — one entry per site slug
// Add new sites here as you expand

export interface SiteConfig {
  name: string;
  slug: string;
  mapImage: string;   // path relative to /public
  svgW: number;       // intrinsic width of the map image in px
  svgH: number;       // intrinsic height of the map image in px
  logoPath?: string;  // optional per-site logo
  metaTitle: string;
  metaDescription: string;
  reraNumber?: string;
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  mangalamcity: {
    name: 'Mangalam City',
    slug: 'mangalamcity',
    mapImage: '/map-layout.png',  // original — do not change
    svgW: 4762,
    svgH: 6735,
    logoPath: '/mangalam-logo.png',
    metaTitle: 'Mangalam City',
    metaDescription: 'Explore premium residential plots in Mangalam City, Rajnandgaon. Interactive sales map with real-time availability, plot details, and pricing.',
    reraNumber: 'PCGRERA081024001839',
  },
  bhaavbhumi: {
    name: 'Bhaavbhumi',
    slug: 'bhaavbhumi',
    mapImage: '/bhaavbhumi-layout.png',
    svgW: 3573,
    svgH: 5031,
    logoPath: undefined,
    metaTitle: 'Bhaavbhumi',
    metaDescription: 'Explore premium residential plots in Bhaavbhumi, Rajnandgaon. Interactive sales map with real-time availability, plot details, and pricing.',
    reraNumber: 'PCGRERA230224001734',
  },
};

export const DEFAULT_SITE: SiteConfig = SITE_CONFIGS['mangalamcity'];

export function getSiteConfig(slug: string): SiteConfig {
  return SITE_CONFIGS[slug] ?? DEFAULT_SITE;
}
