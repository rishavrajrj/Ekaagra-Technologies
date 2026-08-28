'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StaggerRevealProps {
  children: React.ReactNode;
  staggerInterval?: number; // in milliseconds (default 65ms)
  baseDelay?: number; // initial delay in ms
  maxStaggerDelay?: number; // maximum stagger delay cap (default 280ms)
  duration?: number; // duration in ms
  distance?: number; // distance in px
  threshold?: number;
  className?: string;
  as?: React.ElementType;
}

export default function StaggerReveal({
  children,
  staggerInterval = 65,
  baseDelay = 0,
  maxStaggerDelay = 280,
  duration = 500,
  distance = 16,
  threshold = 0.12,
  className = '',
  as: Component = 'div',
}: StaggerRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
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

    // Safety fallback: guaranteed visibility after 1.5s
    const safetyTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1500 + baseDelay);

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      clearTimeout(safetyTimer);
      return;
    }

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
  }, [threshold, baseDelay]);

  const childrenArray = React.Children.toArray(children);

  return (
    <Component ref={domRef} className={className}>
      {childrenArray.map((child, index) => {
        const itemDelay = Math.min(baseDelay + index * staggerInterval, maxStaggerDelay);
        const itemStyle: React.CSSProperties = {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'none' : `translate3d(0, ${distance}px, 0)`,
          transitionProperty: 'opacity, transform',
          transitionDuration: `${duration}ms`,
          transitionDelay: `${itemDelay}ms`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: isVisible ? 'auto' : 'opacity, transform',
        };

        return (
          <div key={index} style={itemStyle} className="h-full">
            {child}
          </div>
        );
      })}
    </Component>
  );
}
