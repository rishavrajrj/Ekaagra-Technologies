'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

const LERP_FACTOR = 0.08;
const MAX_TILT_X = 6;
const MAX_TILT_Y = 8;

/**
 * Premium Video Logo Component for Ekaagra Technologies
 *
 * Plays the official 3D animated video logo (`/images/logo/logo.mp4`)
 * with subtle 3D hover parallax, soft atmospheric glow, decoupled contact
 * shadow, and instant poster fallback.
 */
export default function Ekaagra3DLogo({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // -- Reduced motion listener ----------------------------------
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // -- Interactive 3D tilt physics (mouse hover) ----------------
  useEffect(() => {
    if (prefersReducedMotion) return;
    const card = cardRef.current;
    if (!card) return;

    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * LERP_FACTOR;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * LERP_FACTOR;

      const rx = currentRef.current.x;
      const ry = currentRef.current.y;

      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0px)`;
      card.style.setProperty('--shadow-shift-x', `${-ry * 1.5}px`);
      card.style.setProperty('--shadow-shift-y', `${rx * 1.5}px`);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [prefersReducedMotion]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);

      targetRef.current = {
        x: -ny * MAX_TILT_X,
        y: nx * MAX_TILT_Y,
      };
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label="Ekaagra Technologies — 3D Animated Logo"
    >
      {/* -- Soft Ambient Back Glow ------------------------------- */}
      <div className="absolute -inset-4 bg-radial from-[#F97360]/15 via-[#4338CA]/10 to-transparent rounded-3xl blur-2xl pointer-events-none opacity-80" />

      {/* -- 3D Card Container ------------------------------------ */}
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden shadow-xl shadow-[#4338CA]/10 border border-[#E2E8F0]/80 bg-[#FAF7F2] transition-shadow duration-300 hover:shadow-2xl hover:shadow-[#4338CA]/20"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {!videoError && !prefersReducedMotion ? (
          <video
            ref={videoRef}
            src="/images/logo/logo.mp4"
            poster="/images/logo/logo.png"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`w-full h-auto object-cover transition-opacity duration-500 ${
              isVideoLoaded ? 'opacity-100' : 'opacity-90'
            }`}
          />
        ) : (
          <Image
            src="/images/logo/logo.png"
            alt="Ekaagra Technologies Logo"
            width={1415}
            height={550}
            priority
            className="w-full h-auto object-contain"
          />
        )}
      </div>
    </div>
  );
}
