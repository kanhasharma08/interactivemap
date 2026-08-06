'use client';

import dynamic from "next/dynamic";
import Image from "next/image";
import type { VrHotspot } from "@/components/PannellumViewer";

const PannellumViewer = dynamic(
  () => import("@/components/PannellumViewer"),
  { ssr: false }
);

const MANGALAM_HOTSPOTS: VrHotspot[] = [
  { yaw: 33.4, pitch: -15.3, label: "Sanjeevni Hospital", distance: "2.1 km", icon: "🏥", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 81.3, pitch: -7.5,  label: "Railway Station",    distance: "5.9 km", icon: "🚂", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -30.4, pitch: -6.7, label: "Gathula",            distance: "8.5 km", icon: "🏙️", direction: "up-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 36.2, pitch: -5.3,  label: "City Centre",        distance: "3.2 km", icon: "🛍️", direction: "down-left", visibleRadius: 22, fadeRadius: 38 },
];

const SUNCITY_HOTSPOTS: VrHotspot[] = [
  { yaw: 35.6, pitch: -77.3, label: "Dmart", distance: "0 km", icon: "🛒", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -144, pitch: -50,   label: "Suncity Anantam", distance: "0 km", icon: "🏙️", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 175,  pitch: -62,   label: "Suncity Samosaran", distance: "0 km", icon: "🏙️", direction: "up-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -16,  pitch: -47,   label: "D extension", distance: "0 km", icon: "🏙️", direction: "down-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -70,  pitch: -55,   label: "B extension", distance: "0 km", icon: "🏙️", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 174,  pitch: -21,   label: "City centre", distance: "0 km", icon: "🛍️", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -32,  pitch: -30,   label: "Mahavir Trade centre", distance: "0 km", icon: "🏢", direction: "up-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 18,   pitch: -57,   label: "Sri Chaitanya techno school", distance: "0 km", icon: "🏫", direction: "down-left", visibleRadius: 22, fadeRadius: 38 },
];

export default function VrPageClient({ site }: { site?: string }) {
  const isSuncity = site === 'suncity';
  const hotspots = isSuncity ? SUNCITY_HOTSPOTS : MANGALAM_HOTSPOTS;
  const imagePath = isSuncity ? "/panorama/suncity.webp" : "/panorama/panorama.webp";
  const logoPath = isSuncity ? "/mahavir-logo.png" : "/mangalam-logo.png";
  
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Dynamic Logo in a frosted pill */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: 30,
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Image
            src={logoPath}
            alt="City Logo"
            width={180}
            height={60}
            style={{ objectFit: "contain", height: 50, width: "auto" }}
            priority
          />
        </div>
      </div>

      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            window.close(); // Try closing the tab first
            window.location.href = `/?site=${site || 'mangalamcity'}`; // Fallback to navigation
          }
        }}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 50,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 20,
          padding: "8px 16px",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <span>&larr;</span> Back to Map
      </button>

      <PannellumViewer
        imagePath={imagePath}
        previewPath="/panorama/preview.webp"
        hotspots={hotspots}
        initialYaw={isSuncity ? -83 : 0}
        initialPitch={isSuncity ? -89 : -5}
        initialHfov={100}
      />
    </div>
  );
}
