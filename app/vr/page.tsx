import type { Metadata } from "next";
import VrPageClient from "./VrPageClient";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ site?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const isSuncity = params?.site === 'suncity';
  return {
    title: isSuncity ? "360° VR View — Suncity" : "360° VR View — Mangalam City",
    description: isSuncity ? "Explore Suncity in immersive 360° view." : "Explore Mangalam City in immersive 360° view.",
  };
}

export default async function VrPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const params = await searchParams;
  return <VrPageClient site={params?.site} />;
}
