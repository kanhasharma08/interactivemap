'use client';

import React from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/context';
import SearchBar from '@/components/SearchBar';

export default function Header() {
  const { getStats } = useApp();
  const stats = getStats();

  return (
    <header className="header">

      {/* ── Desktop layout (hidden on mobile) ── */}
      <div className="header-desktop">

        {/* LEFT — Mahavir + Search */}
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

        {/* CENTER — Mangalam logo pinned to exact middle */}
        <div className="header-center">
          <Image
            src="/mangalam-logo.png"
            alt="Mangalam City"
            width={180}
            height={52}
            style={{ objectFit: 'contain', height: 52, width: 'auto' }}
            priority
          />
        </div>

        {/* RIGHT — Admin */}
        <div className="header-right">

          <a href="/admin" className="admin-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Admin
          </a>
        </div>

      </div>

      {/* ── Mobile layout (hidden on desktop) ── */}
      <div className="header-mobile">

        {/* Row 1: Mahavir | Mangalam | Admin */}
        <div className="header-mobile-row1">
          <Image
            src="/mahavir-logo.png"
            alt="Mahavir Group"
            width={100}
            height={34}
            style={{ objectFit: 'contain', height: 34, width: 'auto' }}
            priority
          />

          <div className="header-mobile-center">
            <Image
              src="/mangalam-logo.png"
              alt="Mangalam City"
              width={130}
              height={38}
              style={{ objectFit: 'contain', height: 38, width: 'auto' }}
              priority
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
