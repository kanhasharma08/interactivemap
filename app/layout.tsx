import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'Mangalam City | Premium Residential Township | Rajnandgaon',
  description: 'Explore premium residential plots in Mangalam City, Rajnandgaon. Interactive sales map with real-time availability, plot details, and pricing.',
  keywords: 'Mangalam City, Rajnandgaon, residential plots, real estate, Chhattisgarh',
  openGraph: {
    title: 'Mangalam City | Premium Township',
    description: 'Interactive sales map for premium residential plots in Rajnandgaon.',
    type: 'website',
  },
};

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

  if (!isLocalhost && !isVercelUrl) {
    // Only extract slug from real custom subdomains, e.g. mangalamcity.mahavirgroupindia.com
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      siteSlug = parts[0];
    }
  }


  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider siteSlug={siteSlug}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
