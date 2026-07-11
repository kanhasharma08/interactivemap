'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Legend from '@/components/Legend';
import PlotDetailPanel from '@/components/PlotDetailPanel';
import OpenSpacePanel from '@/components/OpenSpacePanel';
import { OpenSpace } from '@/types';

// Dynamically import map to avoid SSR issues
const MapCanvas = dynamic(() => import('@/components/MapCanvas'), { ssr: false });

export default function HomePage() {
  const [selectedOpenSpace, setSelectedOpenSpace] = useState<OpenSpace | null>(null);

  return (
    <div className="map-root">
      <Header />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {/* Main interactive map */}
        <MapCanvas onOpenSpaceSelect={setSelectedOpenSpace} />

        {/* Legend */}
        <Legend />

        {/* Plot detail side panel */}
        <PlotDetailPanel />

        {/* Open space info panel */}
        <OpenSpacePanel
          openSpace={selectedOpenSpace}
          onClose={() => setSelectedOpenSpace(null)}
        />
      </div>
    </div>
  );
}
