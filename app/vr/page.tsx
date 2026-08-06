import type { Metadata } from "next";
import VrPageClient from "./VrPageClient";

export const metadata: Metadata = {
  title: "360° VR View — Mangalam City",
  description: "Explore Mangalam City in immersive 360° view.",
};

export default function VrPage() {
  return <VrPageClient />;
}
