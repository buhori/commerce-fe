'use client';

import { useEffect } from 'react';

/** useLockBodyScroll Ambaz: kunci gulir halaman selama laci/modal terbuka. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [locked]);
}
