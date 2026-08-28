'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  maxDistance?: number; // max pull in pixels (default 7px)
  className?: string;
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  maxDistance = 6,
  className = '',
  disabled = false,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch / coarse pointer or reduced motion
    const hasCoarsePointer =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        'ontouchstart' in window);

    setIsTouchDevice(hasCoarsePointer);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || isTouchDevice || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Restrain displacement to maxDistance with smooth falloff
      const pullX = Math.max(-maxDistance, Math.min(maxDistance, distanceX * 0.18));
      const pullY = Math.max(-maxDistance, Math.min(maxDistance, distanceY * 0.18));

      setPosition({ x: pullX, y: pullY });
    },
    [disabled, isTouchDevice, maxDistance]
  );

  const handleMouseEnter = () => {
    if (!disabled && !isTouchDevice) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  const transformStyle: React.CSSProperties = isTouchDevice
    ? {}
    : {
        transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${
          isHovered ? 1.01 : 1
        })`,
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)'
          : 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: isHovered ? 'transform' : 'auto',
      };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={transformStyle}
      className={`inline-block ${className}`}
    >
      {children}
    </div>
  );
}
