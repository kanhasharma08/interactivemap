'use client';

import dynamic from "next/dynamic";
import Image from "next/image";
import type { VrHotspot } from "@/components/PannellumViewer";

const PannellumViewer = dynamic(
  () => import("@/components/PannellumViewer"),
  { ssr: false }
);

const MANGALAM_HOTSPOTS: VrHotspot[] = [
  { yaw: 33.4, pitch: -15.3, label: "Sanjeevni Hospital",  distance: "1.5 km", icon: "hospital", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 81.3, pitch: -7.5,  label: "Railway Station",     distance: "3 km",   icon: "train", direction: "up-right",   visibleRadius: 22, fadeRadius: 38 },
  { yaw: 105,  pitch: -6.5,  label: "Bus Stand",           distance: "3 km",   icon: "bus", direction: "up-right",   visibleRadius: 22, fadeRadius: 38 },
  { yaw: -30.4, pitch: -6.7, label: "Gathula",             distance: "3.5 km", icon: "city", direction: "up-right",   visibleRadius: 22, fadeRadius: 38 },
  { yaw: 36.2, pitch: -5.3,  label: "City Centre",                             icon: "shopping", direction: "down-left",  visibleRadius: 22, fadeRadius: 38 },
  { yaw: 47,     pitch: -3.7,  label: "D-mart ( Suncity )",                       icon: "shopping", direction: "up-right",  visibleRadius: 22, fadeRadius: 38 },
  { yaw: -42.24, pitch: -5,    label: "NBIS",                distance: "5 km",   icon: "school", direction: "up-left",   visibleRadius: 22, fadeRadius: 38 },
  { yaw: -4.75,  pitch: -28,   label: "Mangalam City",     isFloorLogo: true,  visibleRadius: 40, fadeRadius: 60 },
];

const SUNCITY_HOTSPOTS: VrHotspot[] = [
  { yaw: 35.6, pitch: -77.3, label: "Dmart", distance: "200 m", icon: "shopping", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -144, pitch: -50,   label: "Suncity Anantam", icon: "buildings", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 175,  pitch: -62,   label: "Suncity Samosaran", icon: "buildings", direction: "up-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -16,  pitch: -47,   label: "D extension", icon: "buildings", direction: "down-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -70,  pitch: -55,   label: "B extension", icon: "buildings", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 174,  pitch: -21,   label: "City centre", distance: "1 km", icon: "shopping", direction: "down-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -32,  pitch: -30,   label: "Mahavir Trade centre", distance: "1.6 km", icon: "buildings", direction: "up-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 18,   pitch: -57,   label: "Sri Chaitanya techno school", distance: "300 m", icon: "school", direction: "down-left", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -117, pitch: -19,   label: "Anant Palace",        distance: "1.5 km", icon: "event", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: -155.77,pitch: -26.3, label: "Haldiram's",          distance: "600 m", icon: "food", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 143.78, pitch: -23,   label: "Temple",              distance: "1.1 km", icon: "temple", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 114,    pitch: -9.5,  label: "Railway station",     distance: "3 km", icon: "train", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 124,    pitch: -41,   label: "Mohobe Hospital",     distance: "700 m", icon: "hospital", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
  { yaw: 79,     pitch: -11.3, label: "Mahavir Kalpavriksh", distance: "2.6 km", icon: "buildings", direction: "up-right", visibleRadius: 22, fadeRadius: 38 },
];

export default function VrPageClient({ site }: { site?: string }) {
  const isSuncity = site === 'suncity';
  const hotspots = isSuncity ? SUNCITY_HOTSPOTS : MANGALAM_HOTSPOTS;
  const imagePath = isSuncity ? "/panorama/suncity.webp" : "/panorama/panorama.webp";
  const logoPath = isSuncity ? "/mahavir-logo.png" : "/mangalam-logo.png";
  
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overscrollBehavior: "none", touchAction: "none" }}>
      {/* Dynamic Logo in a frosted pill */}
      <div className="vr-top-logo-pill">
        <Image
          src={logoPath}
          alt="City Logo"
          width={180}
          height={60}
          className="vr-top-logo-img"
          priority
        />
      </div>

      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            window.close(); // Try closing the tab first
            window.location.href = `/?site=${site || 'mangalamcity'}`; // Fallback to navigation
          }
        }}
        className="vr-back-btn"
        title="Back to Map"
      >
        <span style={{ fontSize: '1.1em', lineHeight: 1 }}>&larr;</span>
        <span className="vr-back-btn-text">Back to Map</span>
      </button>

      <PannellumViewer
        imagePath={imagePath}
        previewPath="/panorama/preview.webp"
        hotspots={hotspots}
        initialYaw={isSuncity ? -83 : 0}
        initialPitch={isSuncity ? -89 : -20}
        initialHfov={100}
      />

      <style>{`
        .vr-top-logo-pill {
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 50;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 30px;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          user-select: none;
        }

        .vr-top-logo-img {
          object-fit: contain;
          height: 50px;
          width: auto;
          display: block;
        }

        .vr-back-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 50;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 8px 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          user-select: none;
        }

        .vr-back-btn:hover {
          background: rgba(0, 0, 0, 0.85);
          transform: scale(1.04);
        }

        @media (max-width: 768px) {
          .vr-top-logo-pill {
            top: max(14px, env(safe-area-inset-top, 14px));
            left: max(14px, env(safe-area-inset-left, 14px));
            padding: 5px 12px;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
          }

          .vr-top-logo-img {
            height: 32px;
          }

          .vr-back-btn {
            top: max(14px, env(safe-area-inset-top, 14px));
            right: max(14px, env(safe-area-inset-right, 14px));
            padding: 7px 12px;
            font-size: 12px;
            border-radius: 16px;
            gap: 5px;
          }
        }

        @media (max-width: 390px) {
          .vr-top-logo-pill {
            top: max(12px, env(safe-area-inset-top, 12px));
            left: max(10px, env(safe-area-inset-left, 10px));
            padding: 4px 10px;
          }

          .vr-top-logo-img {
            height: 26px;
          }

          .vr-back-btn {
            top: max(12px, env(safe-area-inset-top, 12px));
            right: max(10px, env(safe-area-inset-right, 10px));
            padding: 6px 10px;
            font-size: 11px;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
