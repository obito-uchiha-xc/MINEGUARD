import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { ScrollProgressBar } from '../ui/ScrollProgressBar';
import { EmergencyHazardBanner } from '../alerts/EmergencyHazardBanner';
import './AppShell.css';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  // Initialize buttery-smooth momentum scrolling (Lenis) per design.md Section 4
  useEffect(() => {
    if (!mainRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: mainRef.current,
      content: contentRef.current,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.6,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top smoothly on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="mg-app-shell">
      {/* SMOOTH GOLDEN SCROLL PROGRESS BAR */}
      <ScrollProgressBar containerRef={mainRef} />

      {/* PERSISTENT SIDEBAR */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* MAIN VIEWPORT AREA WITH INERTIAL SMOOTH SCROLLING */}
      <div className="mg-app-shell__main" ref={mainRef}>
        {/* PERSISTENT STICKY HEADER STACK */}
        <div className="mg-app-shell__header-wrapper">
          <TopBar
            isSidebarCollapsed={isCollapsed}
            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
            onOpenMobileMenu={() => setIsMobileOpen(true)}
          />
          {/* EMERGENCY HAZARD ALARM BANNER (GLOBAL PERSISTENT NOTIFICATION & SILENCE CONTROL) */}
          <EmergencyHazardBanner />
        </div>

        {/* SCROLLABLE PAGE CONTENT WITH PAGE-TO-PAGE CHOOSING TRANSITIONS */}
        <div className="mg-app-shell__content" ref={contentRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mg-app-shell__page-motion"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* PERSISTENT FOOTER */}
        <Footer />
      </div>
    </div>
  );
};

