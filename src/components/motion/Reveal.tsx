'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number; // in milliseconds
  duration?: number; // in milliseconds
  distance?: number; // in pixels
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  blur?: number; // in pixels
  threshold?: number;
  className?: string;
  as?: React.ElementType;
}

export default function Reveal({
  children,
  delay = 0,
  duration = 550,
  distance = 18,
  direction = 'up',
  blur = 3,
  threshold = 0.12,
  className = '',
  as: Component = 'div',
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion or window is SSR
    if (typeof window === 'undefined') return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const element = domRef.current;
    if (!element) {
      setIsVisible(true);
      return;
    }

    // Safety fallback: ensure content becomes visible within 1.5s no matter what
    const safetyTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1500 + delay);

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      clearTimeout(safetyTimer);
      return;
    }

    // Check if already in viewport on mount
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      clearTimeout(safetyTimer);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            clearTimeout(safetyTimer);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    observer.observe(element);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, [threshold, delay]);

  const getTransform = () => {
    if (isVisible) return 'none';
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0)`;
      case 'down':
        return `translate3d(0, -${distance}px, 0)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0)`;
      case 'none':
      default:
        return 'none';
    }
  };

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    filter: blur > 0 ? (isVisible ? 'blur(0px)' : `blur(${blur}px)`) : undefined,
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: isVisible ? 'auto' : 'opacity, transform, filter',
  };

  return (
    <Component ref={domRef} style={style} className={className}>
      {children}
    </Component>
  );
}
