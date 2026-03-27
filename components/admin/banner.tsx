'use client';

import { useEffect, useState } from 'react';

export interface BannerMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let nextId = 1;

export function createBanner(message: string, type: 'success' | 'error'): BannerMessage {
  return { id: nextId++, message, type };
}

interface BannerStackProps {
  banners: BannerMessage[];
  onDismiss: (id: number) => void;
}

export function BannerStack({ banners, onDismiss }: BannerStackProps) {
  return (
    <>
      {banners.map((banner) => (
        <Banner key={banner.id} banner={banner} onDismiss={() => onDismiss(banner.id)} />
      ))}
    </>
  );
}

function Banner({ banner, onDismiss }: { banner: BannerMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: timer should only start once

  if (!visible) return null;

  const isSuccess = banner.type === 'success';

  return (
    <div className={`mb-3 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium ${
      isSuccess ? 'bg-emerald-50' : 'bg-red-50'
    }`} style={{ color: isSuccess ? '#065F46' : '#991B1B' }}>
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 8l3.5 3.5L13 5"/></svg>
        ) : (
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5"/><circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none"/></svg>
        )}
        {banner.message}
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss(); }}
        className={`ml-4 rounded p-1 transition-colors ${
          isSuccess ? 'hover:bg-emerald-100' : 'hover:bg-red-100'
        }`}
        style={{ color: isSuccess ? '#059669' : '#DC2626' }}
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8"/></svg>
      </button>
    </div>
  );
}
