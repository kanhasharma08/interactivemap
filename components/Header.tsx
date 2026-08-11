'use client';

import React from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/context';
import SearchBar from '@/components/SearchBar';
import { getSiteConfig } from '@/data/sites';

// Resolves the correct URL for the All Maps landing page
function getAllMapsUrl(): string {
  if (typeof window === 'undefined') return 'https://maps.mahavirgroupindia.com';
  const hostname = window.location.hostname;
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isVercel = hostname.endsWith('.vercel.app') || hostname.endsWith('.now.sh');
  if (isLocalhost || isVercel) return '/maps';
  // Strip existing subdomain and prefix with 'maps'
  const parts = hostname.split('.');
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  return `https://maps.${baseDomain}`;
}

export default function Header() {
  const { siteSlug } = useApp();
  const siteConfig = getSiteConfig(siteSlug);
  const isMultiLogo = siteConfig.logos && siteConfig.logos.length > 1;

  return (
    <header className="header">

      {/* ── Desktop layout ── */}
      <div className="header-desktop">

        {/* LEFT — Mahavir logo + Search */}
        <div className="header-left">
          <div className="header-logo-wrap">
            <Image
              src="/mahavir-logo.png"
              alt="Mahavir Group"
              width={120}
              height={40}
              style={{ objectFit: 'contain', height: 40, width: 'auto' }}
              priority
            />
          </div>
          <div className="header-search-wrap">
            <SearchBar />
          </div>
        </div>

        {/* CENTER */}
        {isMultiLogo ? (
          /* ── Multi-project: clean floating logos ── */
          <div className="header-multi-center">
            {siteConfig.logos!.map((logoEntry, idx) => (
              <React.Fragment key={logoEntry.label}>
                <div className="hmc-item">
                  {/* Logo image — square crop to circle for clean look */}
                  <div className="hmc-logo-wrap">
                    <Image
                      src={logoEntry.path}
                      alt={logoEntry.label}
                      width={50}
                      height={50}
                      style={{ objectFit: 'contain', width: 50, height: 50 }}
                      priority
                    />
                  </div>
                  {/* Name + RERA stacked */}
                  <div className="hmc-info">
                    <span className="hmc-name">{logoEntry.label}</span>
                    <span className="hmc-rera">
                      <span className="hmc-rera-tag">RERA</span>
                      <span className="hmc-rera-num">{logoEntry.reraNumber}</span>
                    </span>
                  </div>
                </div>
                {idx < siteConfig.logos!.length - 1 && (
                  <div className="hmc-divider" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          /* ── Single logo pill ── */
          <div className={`header-center ${siteSlug === 'bhaavbhumi' ? 'no-bg' : ''}`}>
            {siteConfig.logoPath ? (
              <Image
                src={siteConfig.logoPath}
                alt={siteConfig.name}
                width={180}
                height={52}
                style={{ objectFit: 'contain', height: 52, width: 'auto' }}
                priority
              />
            ) : (
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: 1 }}>
                {siteConfig.name}
              </h1>
            )}
          </div>
        )}

        {/* RIGHT — RERA badge (single-site only) + All Maps + Admin */}
        <div className="header-right">
          {!isMultiLogo && siteConfig.reraNumber && (
            <div className="rera-badge-desktop">
              <span className="rera-badge-label">RERA APPROVED</span>
              <span className="rera-badge-val">{siteConfig.reraNumber}</span>
            </div>
          )}
          <a href={getAllMapsUrl()} className="admin-btn" style={{ gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            All Maps
          </a>
          <a href="/admin" className="admin-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Admin
          </a>
        </div>

      </div>

      {/* ── Mobile layout ── */}
      <div className="header-mobile">

        {/* Row 1: Mahavir | [logos] | Admin */}
        <div className="header-mobile-row1">
          <Image
            src="/mahavir-logo.png"
            alt="Mahavir Group"
            width={90}
            height={30}
            style={{ objectFit: 'contain', height: 30, width: 'auto' }}
            priority
          />

          {isMultiLogo ? (
            <div className="hmc-mobile">
              {siteConfig.logos!.map((logoEntry, idx) => (
                <React.Fragment key={logoEntry.label}>
                  <div className="hmc-mobile-item">
                    <Image
                      src={logoEntry.path}
                      alt={logoEntry.label}
                      width={30}
                      height={30}
                      style={{ objectFit: 'contain', width: 30, height: 30, borderRadius: '50%', background: '#000', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
                      priority
                    />
                    <div className="hmc-mobile-info">
                      <span className="hmc-mobile-name">{logoEntry.label}</span>
                      <span className="hmc-mobile-rera">
                        <span className="hmc-rera-tag-sm">RERA</span>
                        <span className="hmc-mobile-rera-num">{logoEntry.reraNumber}</span>
                      </span>
                    </div>
                  </div>
                  {idx < siteConfig.logos!.length - 1 && (
                    <div style={{ width: 1, height: 30, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className={`header-mobile-center ${siteSlug === 'bhaavbhumi' ? 'no-bg' : ''}`}>
              {siteConfig.logoPath ? (
                <Image
                  src={siteConfig.logoPath}
                  alt={siteConfig.name}
                  width={120}
                  height={34}
                  style={{ objectFit: 'contain', height: 34, width: 'auto' }}
                  priority
                />
              ) : (
                <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{siteConfig.name}</div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href={getAllMapsUrl()} className="admin-btn-mobile" title="All Maps">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </a>
            <a href="/admin" className="admin-btn-mobile">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="header-mobile-row2">
          <div className="header-search-wrap-mobile">
            <SearchBar />
          </div>
        </div>

      </div>
    </header>
  );
}
