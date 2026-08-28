'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  SHOWCASE_CONFIG,
  SHOWCASE_TOUR_STEPS,
  SHOWCASE_MIN_DESKTOP_WIDTH,
  type ShowcaseTourStep,
} from './showcaseConfig';

interface ShowcaseContextValue {
  isOpen: boolean;
  currentStepIndex: number;
  currentStep: ShowcaseTourStep;
  steps: ShowcaseTourStep[];
  isPaused: boolean;
  isHudVisible: boolean;
  openShowcase: () => void;
  closeShowcase: () => void;
  toggleShowcase: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  togglePause: () => void;
  setIsPaused: (paused: boolean) => void;
  showHudTemporarily: () => void;
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

export function ShowcaseProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [isAutoDisabled, setIsAutoDisabled] = useState<boolean>(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimeRef = useRef<number>(0);

  // Timing tracking for seamless pause & resume
  const stepStartTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  const steps = SHOWCASE_TOUR_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];

  const wasInFullscreenRef = useRef<boolean>(false);

  // -- Smooth Camera Scroll Helper to Real Website Section ---------
  const scrollToSection = useCallback((sectionId: string) => {
    if (typeof window === 'undefined') return;

    if (sectionId === 'hero' || !sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // -- Show HUD temporarily on user motion -------------------------
  const showHudTemporarily = useCallback(() => {
    setIsHudVisible(true);
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
    }
    hudTimerRef.current = setTimeout(() => {
      setIsHudVisible(false);
    }, 4000);
  }, []);

  // -- Open Showcase (Desktop Displays Only) -----------------------
  const openShowcase = useCallback(() => {
    // Exclude small devices (phones and tablets < 1024px)
    if (typeof window === 'undefined' || window.innerWidth < SHOWCASE_MIN_DESKTOP_WIDTH) {
      return;
    }

    setIsOpen(true);
    setCurrentStepIndex(0);
    setIsPaused(false);
    setIsHudVisible(true);
    elapsedBeforePauseRef.current = 0;
    stepStartTimeRef.current = Date.now();
    openTimeRef.current = Date.now();

    // Request browser fullscreen mode if supported
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement
          .requestFullscreen()
          .then(() => {
            wasInFullscreenRef.current = true;
          })
          .catch(() => {
            // Graceful fallback if blocked by browser policy
            wasInFullscreenRef.current = false;
          });
      }
    }

    // Smoothly scroll to the top hero section of the real website
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // -- Close Showcase ----------------------------------------------
  const closeShowcase = useCallback(() => {
    setIsOpen(false);
    setIsPaused(false);
    wasInFullscreenRef.current = false;
    elapsedBeforePauseRef.current = 0;
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);

    // Exit browser fullscreen mode if active
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // -- Close Showcase automatically on screen shrink (e.g. tablet/phone resize) --
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < SHOWCASE_MIN_DESKTOP_WIDTH) {
        closeShowcase();
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, closeShowcase]);

  // -- Sync with Browser Fullscreen Change (e.g. user pressed Esc) --
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof document !== 'undefined') {
        if (document.fullscreenElement) {
          wasInFullscreenRef.current = true;
        } else if (wasInFullscreenRef.current && isOpen) {
          closeShowcase();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen, closeShowcase]);

  // -- Scrollbar Hiding during Showcase (Allows window.scrollTo) ----
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    document.documentElement.classList.add('showcase-fullscreen-mode');

    return () => {
      document.documentElement.classList.remove('showcase-fullscreen-mode');
    };
  }, [isOpen]);

  // -- Toggle Showcase ---------------------------------------------
  const toggleShowcase = useCallback(() => {
    if (isOpen) {
      closeShowcase();
    } else {
      openShowcase();
    }
  }, [isOpen, closeShowcase, openShowcase]);

  // -- Navigation across real website sections ---------------------
  const goToStep = useCallback(
    (index: number) => {
      const safeIndex = (index + steps.length) % steps.length;
      elapsedBeforePauseRef.current = 0;
      stepStartTimeRef.current = Date.now();
      setCurrentStepIndex(safeIndex);
      scrollToSection(steps[safeIndex].sectionId);
    },
    [steps, scrollToSection]
  );

  const nextStep = useCallback(() => {
    elapsedBeforePauseRef.current = 0;
    stepStartTimeRef.current = Date.now();
    setCurrentStepIndex((prev) => {
      const nextIdx = (prev + 1) % steps.length;
      scrollToSection(steps[nextIdx].sectionId);
      return nextIdx;
    });
  }, [steps, scrollToSection]);

  const prevStep = useCallback(() => {
    elapsedBeforePauseRef.current = 0;
    stepStartTimeRef.current = Date.now();
    setCurrentStepIndex((prev) => {
      const prevIdx = (prev === 0 ? steps.length - 1 : prev - 1);
      scrollToSection(steps[prevIdx].sectionId);
      return prevIdx;
    });
  }, [steps, scrollToSection]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        // Record elapsed time before pause
        const elapsed = Date.now() - stepStartTimeRef.current;
        elapsedBeforePauseRef.current += Math.max(0, elapsed);
        if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      } else {
        // Resuming: start timing from now with remaining duration
        stepStartTimeRef.current = Date.now();
      }
      return next;
    });
  }, []);

  // -- URL Query Param Initialization (?showcase=true / ?showcase=false) -
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const showcaseParam = searchParams.get('showcase');

      if (showcaseParam === 'true' || showcaseParam === '1') {
        openShowcase();
      } else if (showcaseParam === 'false' || showcaseParam === '0') {
        setIsAutoDisabled(true);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [openShowcase]);

  // -- Inactivity Detection (When Showcase is CLOSED, Desktop Only) -
  useEffect(() => {
    if (
      !SHOWCASE_CONFIG.autoTriggerOnIdle ||
      isOpen ||
      !SHOWCASE_CONFIG.enabled ||
      isAutoDisabled ||
      typeof window === 'undefined' ||
      window.innerWidth < SHOWCASE_MIN_DESKTOP_WIDTH
    ) {
      return;
    }

    const idleTimeout = SHOWCASE_CONFIG.idleTimeout; // 30s

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          openShowcase();
        }
      }, idleTimeout);
    };

    resetIdleTimer();

    // Throttled activity listener
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleUserActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        resetIdleTimer();
      }, 250);
    };

    const events = [
      'mousemove',
      'mousedown',
      'touchstart',
      'touchmove',
      'keydown',
      'wheel',
      'scroll',
      'pointerdown',
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isOpen, isAutoDisabled, openShowcase]);

  // -- Event & Hotkey Handling (When Showcase is OPEN) --------------
  useEffect(() => {
    if (!isOpen) return;

    // Mouse or touch motion reveals HUD
    const handleMotion = () => {
      showHudTemporarily();
    };

    // Keyboard hotkeys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeShowcase();
        return;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePause();
        showHudTemporarily();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextStep();
        showHudTemporarily();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevStep();
        showHudTemporarily();
        return;
      }
    };

    window.addEventListener('mousemove', handleMotion, { passive: true });
    window.addEventListener('touchstart', handleMotion, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMotion);
      window.removeEventListener('touchstart', handleMotion);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeShowcase, togglePause, nextStep, prevStep, showHudTemporarily]);

  // -- Automated Camera Progression & Section Step Scrolling --------
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      return;
    }

    const totalDuration = currentStep.duration;
    const remainingTime = Math.max(0, totalDuration - elapsedBeforePauseRef.current);

    stepStartTimeRef.current = Date.now();

    // Ensure camera is smoothly positioned on the active section
    scrollToSection(currentStep.sectionId);

    stepTimerRef.current = setTimeout(() => {
      elapsedBeforePauseRef.current = 0;
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          if (SHOWCASE_CONFIG.loop) {
            scrollToSection(steps[0].sectionId);
            return 0;
          }
          return prev;
        }
        const nextIdx = prev + 1;
        scrollToSection(steps[nextIdx].sectionId);
        return nextIdx;
      });
    }, remainingTime);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [isOpen, isPaused, currentStepIndex, currentStep, steps, scrollToSection]);

  // -- Document Visibility Handling ---------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isOpen && !isPaused) {
          const elapsed = Date.now() - stepStartTimeRef.current;
          elapsedBeforePauseRef.current += Math.max(0, elapsed);
          if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
          setIsPaused(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen, isPaused]);

  const value = useMemo<ShowcaseContextValue>(
    () => ({
      isOpen,
      currentStepIndex,
      currentStep,
      steps,
      isPaused,
      isHudVisible,
      openShowcase,
      closeShowcase,
      toggleShowcase,
      nextStep,
      prevStep,
      goToStep,
      togglePause,
      setIsPaused,
      showHudTemporarily,
    }),
    [
      isOpen,
      currentStepIndex,
      currentStep,
      steps,
      isPaused,
      isHudVisible,
      openShowcase,
      closeShowcase,
      toggleShowcase,
      nextStep,
      prevStep,
      goToStep,
      togglePause,
      showHudTemporarily,
    ]
  );

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
    </ShowcaseContext.Provider>
  );
}

export function useShowcase() {
  const context = useContext(ShowcaseContext);
  if (!context) {
    throw new Error('useShowcase must be used within a ShowcaseProvider');
  }
  return context;
}
