// Site configuration — one entry per site slug
// Add new sites here as you expand

const STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps_images`;


export interface MapVariant {
  id: string;
  label: string;
  mapImage: string;  // path relative to /public
  offsetX?: number;  // horizontal shift in SVG px
  offsetY?: number;  // vertical shift in SVG px (negative = move image up)
  scaleX?: number;   // horizontal scale multiplier (default 1)
  scaleY?: number;   // vertical scale multiplier (default 1)
}

/** Used for multi-project sites that share one map (e.g. Suncity = Extension + Anantam) */
export interface SiteLogoEntry {
  path: string;        // /public path to logo image
  label: string;       // sub-project name shown below logo
  reraNumber: string;  // RERA number for this sub-project
}

export interface SiteConfig {
  name: string;
  slug: string;
  mapImage: string;      // path relative to /public (default / fallback)
  svgW: number;          // intrinsic width of the map image in px
  svgH: number;          // intrinsic height of the map image in px
  logoPath?: string;     // optional single per-site logo
  logos?: SiteLogoEntry[]; // optional multiple logos for multi-project sites
  metaTitle: string;
  metaDescription: string;
  reraNumber?: string;   // single RERA (used when logos[] is absent)
  mapVariants?: MapVariant[]; // optional list of map image variants to switch between
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  mangalamcity: {
    name: 'Mangalam City',
    slug: 'mangalamcity',
    mapImage: `${STORAGE_URL}/mangalamcity/layouts/map-layout-hq-optimized.webp`,  // default is now the HQ map
    svgW: 4762,
    svgH: 6735,
    logoPath: '/mangalam-logo.png',
    metaTitle: 'Mangalam City',
    metaDescription: 'Explore premium residential plots in Mangalam City, Rajnandgaon. Interactive sales map with real-time availability, plot details, and pricing.',
    reraNumber: 'PCGRERA081024001839',
    mapVariants: [
      { id: 'hq',       label: 'Map 1 (HQ)',      mapImage: `${STORAGE_URL}/mangalamcity/layouts/map-layout-hq-optimized.webp`, offsetX: 20, offsetY: 530, scaleX: 0.9933, scaleY: 0.8419 },
      { id: 'original', label: 'Map 2 (Original)', mapImage: `${STORAGE_URL}/mangalamcity/layouts/map-layout-optimized.webp`,    offsetX: 0,  offsetY: 0,   scaleX: 1,      scaleY: 1      },
    ],
  },
  bhaavbhumi: {
    name: 'Bhaavbhumi',
    slug: 'bhaavbhumi',
    mapImage: `${STORAGE_URL}/bhaavbhumi/layouts/bhaavbhumi-layout.webp`,
    svgW: 3573,
    svgH: 5031,
    logoPath: '/bhaavbhumi-logo.png',
    metaTitle: 'Bhaavbhumi',
    metaDescription: 'Explore premium residential plots in Bhaavbhumi, Rajnandgaon. Interactive sales map with real-time availability, plot details, and pricing.',
    reraNumber: 'PCGRERA230224001734',
  },
  suncity: {
    name: 'Suncity',
    slug: 'suncity',
    mapImage: `${STORAGE_URL}/suncity/layouts/suncity-layout.webp`,
    svgW: 5247,
    svgH: 4176,
    metaTitle: 'Suncity — Mahavir Group',
    metaDescription: 'Explore premium residential plots in Suncity, Rajnandgaon. Interactive sales map for Suncity Extension and Suncity Anantam with real-time availability, plot details, and pricing.',
    logos: [
      {
        path: '/extension.png',
        label: 'Suncity Extension',
        reraNumber: 'PCGRERA200226002044',
      },
      {
        path: '/anantam.png',
        label: 'Suncity Anantam',
        reraNumber: 'PCGRERA251124001853',
      },
    ],
  },
};

export const DEFAULT_SITE: SiteConfig = SITE_CONFIGS['mangalamcity'];

export function getSiteConfig(slug: string): SiteConfig {
  return SITE_CONFIGS[slug] ?? DEFAULT_SITE;
}
