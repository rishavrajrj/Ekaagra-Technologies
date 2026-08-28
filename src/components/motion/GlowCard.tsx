'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // default rgba(67, 56, 202, 0.06)
  as?: React.ElementType;
  onClick?: (e: React.MouseEvent) => void;
}

export default function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(67, 56, 202, 0.06)',
  as: Component = 'div',
  onClick,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const hasCoarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        'ontouchstart' in window);

    setIsTouchDevice(hasCoarse);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice || !cardRef.current) return;
      const el = cardRef.current;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        el.style.setProperty('--glow-x', `${x}px`);
        el.style.setProperty('--glow-y', `${y}px`);
      });
    },
    [isTouchDevice]
  );

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <Component
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`card-popup relative overflow-hidden ${className}`}
      style={{
        '--glow-x': '-1000px',
        '--glow-y': '-1000px',
      } as React.CSSProperties}
    >
      {/* Dynamic Cursor-Following Radial Highlight (Desktop Zero-Rerender CSS Variable) */}
      {!isTouchDevice && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(360px circle at var(--glow-x) var(--glow-y), ${glowColor}, transparent 50%)`,
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">{children}</div>
    </Component>
  );
}
