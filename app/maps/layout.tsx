import React from 'react';
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Mahavir Group — All Projects',
  description: 'Explore all Mahavir Group residential projects with interactive maps, real-time plot availability, pricing and RERA details.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// The /maps landing page does NOT need the AppProvider (no Supabase siteSlug context needed)
// It uses its own standalone layout
export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#060d1f' }}>
        {children}
      </body>
    </html>
  );
}
