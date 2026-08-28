'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StaggerRevealProps {
  children: React.ReactNode;
  staggerInterval?: number; // in milliseconds (default 70ms)
  baseDelay?: number; // initial delay in ms
  duration?: number; // duration in ms
  distance?: number; // distance in px
  threshold?: number;
  className?: string;
  as?: React.ElementType;
}

export default function StaggerReveal({
  children,
  staggerInterval = 70,
  baseDelay = 0,
  duration = 600,
  distance = 20,
  threshold = 0.15,
  className = '',
  as: Component = 'div',
}: StaggerRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const element = domRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
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
      observer.disconnect();
    };
  }, [threshold]);

  const childrenArray = React.Children.toArray(children);

  return (
    <Component ref={domRef} className={className}>
      {childrenArray.map((child, index) => {
        const itemDelay = baseDelay + index * staggerInterval;
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
