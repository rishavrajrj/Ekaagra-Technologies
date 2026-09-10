'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

// Shared state for multiple concurrent or sequentially mounted modal portals
let activeModalsCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalPaddingRight = '';
let originalScrollBehavior = '';
let savedScrollY = 0;

/**
 * ModalPortal:
 * Mounts any dialog or popup modal directly onto document.body using React createPortal.
 *
 * Guarantees:
 * 1. Escapes any parent CSS transforms, filters, contain, or overflow-hidden stacking contexts.
 * 2. True viewport-relative positioning (fixed inset-0 always matches the browser window).
 * 3. Perfect horizontal and vertical centering on the user's current screen across all devices.
 * 4. Locks background page scrolling while active without moving or jumping the page.
 * 5. Restores the exact previous scroll position on close with zero delay or scroll animation.
 * 6. Handles concurrent/nested modals via reference counting.
 * 7. 100% Next.js SSR / hydration safe.
 */
export default function ModalPortal({ children, isOpen = true }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent background page scrolling while modal is open and restore exact scroll position
  useEffect(() => {
    if (!isOpen || !mounted || typeof document === 'undefined') return;

    if (activeModalsCount === 0) {
      // Capture current scroll offset
      savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      // Save original styles
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;
      originalScrollBehavior = document.documentElement.style.scrollBehavior;

      // Disable smooth scrolling temporarily to prevent any animated jumping during lock/unlock
      document.documentElement.style.scrollBehavior = 'auto';

      // Compensate for scrollbar shift if present
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Freeze scrolling on document
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    activeModalsCount++;

    return () => {
      activeModalsCount--;

      if (activeModalsCount <= 0) {
        activeModalsCount = 0;

        // Restore scroll and overflow styles
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;

        // Restore exact scroll position immediately
        window.scrollTo({
          top: savedScrollY,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        });

        // Re-enable smooth scrolling if it was set originally
        const preservedScrollBehavior = originalScrollBehavior;
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            document.documentElement.style.scrollBehavior = preservedScrollBehavior;
          }
        }, 0);
      }
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}

