'use client';

import React, { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mediaQuery.matches);
    }
  }, []);

  return (
    <div
      style={
        isReducedMotion
          ? undefined
          : {
              animation: 'pageEntrance 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }
      }
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </div>
  );
}
