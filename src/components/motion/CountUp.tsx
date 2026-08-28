'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number; // in milliseconds (default 1600ms)
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function CountUp({
  end,
  start = 0,
  duration = 1600,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: CountUpProps) {
  const [value, setValue] = useState(start);
  const [hasTriggered, setHasTriggered] = useState(false);
  const domRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setValue(end);
      setHasTriggered(true);
      return;
    }

    const element = domRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered) {
            setHasTriggered(true);
            observer.unobserve(entry.target);

            // Animate number interpolation
            let startTime: number | null = null;

            const step = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              // Ease out quint curve
              const easeProgress = 1 - Math.pow(1 - progress, 4);
              const currentVal = start + (end - start) * easeProgress;

              setValue(currentVal);

              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setValue(end);
              }
            };

            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [end, start, duration, hasTriggered]);

  const formattedNumber =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString();

  return (
    <span ref={domRef} className={className}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
