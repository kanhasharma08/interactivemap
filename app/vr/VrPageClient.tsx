'use client';

import dynamic from "next/dynamic";
import Image from "next/image";

const PannellumViewer = dynamic(
  () => import("@/components/PannellumViewer"),
  { ssr: false }
);

const MANGALAM_HOTSPOTS = [
  { yaw: 33.4, pitch: -15.3, label: "Sanjeevni Hospital", distance: "2.1 km", icon: "🏥", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 81.3, pitch: -7.5,  label: "Railway Station",    distance: "5.9 km", icon: "🚂", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -30.4, pitch: -6.7, label: "Gathula",            distance: "8.5 km", icon: "🏙️", direction: "up-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 36.2, pitch: -5.3,  label: "City Centre",        distance: "3.2 km", icon: "🛍️", direction: "down-left", visibleRadius: 22, fadeRadius: 38 },
];

export default function VrPageClient() {
  return (
    <main style={{ width: "100vw", height: "100vh", background: "#000", overflow: "hidden", position: "fixed", inset: 0 }}>

      {/* ── Top bar ── */}
      <div style={{
        position: "fixed", top: 14, left: 0, right: 0,
        zIndex: 10000, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
        pointerEvents: "none",
      }}>
        {/* Left: Mangalam logo */}
        <div style={{
          pointerEvents: "auto",
          background: "rgba(0,0,0,0.60)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
          padding: "6px 12px",
          display: "flex", alignItems: "center",
        }}>
          <Image
            src="/mangalam-logo.png"
            alt="Mangalam City"
            width={180}
            height={60}
            style={{ objectFit: "contain", height: 50, width: "auto" }}
            priority
          />
        </div>

        {/* Right: Back to Map */}
        <a
          href="/"
          style={{
            pointerEvents: "auto",
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(0,0,0,0.60)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
            padding: "9px 16px", borderRadius: 10,
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
            textDecoration: "none", whiteSpace: "nowrap",
            letterSpacing: "0.2px",
          }}
        >
          ← Back to Map
        </a>
      </div>

      <PannellumViewer
        imagePath="/panorama/panorama.webp"
        previewPath="/panorama/preview.webp"
        hotspots={MANGALAM_HOTSPOTS}
        initialYaw={0}
        initialPitch={-5}
        initialHfov={100}
      />
    </main>
  );
}
