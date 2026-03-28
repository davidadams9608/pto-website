'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { createBanner, type BannerMessage } from './banner';

/**
 * Hook for managing banner messages on admin pages.
 * Reads `?success=` and `?error=` URL params for redirect-based banners.
 */
export function useBanners() {
  const [banners, setBanners] = useState<BannerMessage[]>([]);
  const searchParams = useSearchParams();
  const handled = useRef(false);

  // Read URL params on mount (for redirect-based banners)
  useEffect(() => {
    if (handled.current) return;
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success || error) {
      handled.current = true;
      if (success) setBanners((prev) => [...prev, createBanner(success, 'success')]); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: reading URL params requires mount
      if (error) setBanners((prev) => [...prev, createBanner(error, 'error')]); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: reading URL params requires mount
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);

  const addBanner = (message: string, type: 'success' | 'error') => {
    setBanners((prev) => [...prev, createBanner(message, type)]);
  };

  const dismissBanner = (id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return { banners, addBanner, dismissBanner };
}
