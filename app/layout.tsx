import type { Metadata } from 'next';
import './globals.css';
import { AppProvider, HoverProvider } from '@/lib/context';
import { headers, cookies } from 'next/headers';
import { getSiteConfig } from '@/data/sites';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  
  let siteSlug = 'mangalamcity';
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isVercelUrl = hostname.endsWith('.vercel.app') || hostname.endsWith('.now.sh');

  if (isLocalhost || isVercelUrl) {
    const cookieStore = await cookies();
    const testSlug = cookieStore.get('testSiteSlug')?.value;
    if (testSlug) siteSlug = testSlug;
  } else {
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      siteSlug = parts[0];
    }
  }

  const site = getSiteConfig(siteSlug);

  return {
    title: site.metaTitle,
    description: site.metaDescription,
    keywords: `${site.name}, residential plots, real estate`,
    openGraph: {
      title: site.metaTitle,
      description: site.metaDescription,
      type: 'website',
    },
  };
}

// Prevent the browser from applying native pinch-to-zoom on top of our custom map zoom
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  
  let siteSlug = 'mangalamcity';
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  // Skip Vercel preview/deployment URLs — they look like subdomains but aren't real site slugs
  const isVercelUrl = hostname.endsWith('.vercel.app') || hostname.endsWith('.now.sh');

  if (isLocalhost || isVercelUrl) {
    const cookieStore = await cookies();
    const testSlug = cookieStore.get('testSiteSlug')?.value;
    if (testSlug) siteSlug = testSlug;
  } else {
    // Only extract slug from real custom subdomains, e.g. mangalamcity.mahavirgroupindia.com
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      siteSlug = parts[0];
    }
  }


  const panoImage = siteSlug === 'suncity' ? '/panorama/suncity.webp' : '/panorama/panorama.webp';

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="preload" href={panoImage} as="image" />
      </head>
      <body>
        <AppProvider siteSlug={siteSlug}>
          <HoverProvider>
            {children}
          </HoverProvider>
        </AppProvider>
      </body>
    </html>
  );
}
