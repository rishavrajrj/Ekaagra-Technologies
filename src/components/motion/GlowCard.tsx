'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // default rgba(67, 56, 202, 0.08)
  as?: React.ElementType;
  onClick?: (e: React.MouseEvent) => void;
}

export default function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(67, 56, 202, 0.07)',
  as: Component = 'div',
  onClick,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const hasCoarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        'ontouchstart' in window);

    setIsTouchDevice(hasCoarse);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [isTouchDevice]
  );

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <Component
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`card-popup relative overflow-hidden ${className}`}
    >
      {/* Dynamic Cursor-Following Radial Highlight (Desktop Only) */}
      {!isTouchDevice && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 45%)`,
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">{children}</div>
    </Component>
  );
}
