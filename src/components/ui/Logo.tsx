'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({
  className = '',
  size = 'md',
}: LogoProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const sizeClasses = {
    sm: 'h-8 sm:h-9 max-w-[130px] sm:max-w-[145px]',
    md: 'h-9 sm:h-10 md:h-11 max-w-[150px] sm:max-w-[170px] md:max-w-[185px]',
    lg: 'h-11 sm:h-12 md:h-14 max-w-[180px] sm:max-w-[205px] md:max-w-[230px]',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {!videoError && !prefersReducedMotion ? (
        <video
          src="/images/logo/logo.mp4"
          poster="/images/logo/logo.png"
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          preload="auto"
          onError={() => setVideoError(true)}
          className={`w-auto ${sizeClasses[size]} object-contain rounded-lg transition-transform duration-200 hover:scale-[1.02]`}
          aria-label="Ekaagra Technologies"
        />
      ) : (
        <Image
          src="/images/logo/logo.png"
          alt="Ekaagra Technologies"
          width={1415}
          height={550}
          priority
          className={`w-auto ${sizeClasses[size]} object-contain`}
        />
      )}
    </div>
  );
}
