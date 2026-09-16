import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingStats } from '../components/landing/LandingStats';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingHowItWorks } from '../components/landing/LandingHowItWorks';
import { LandingArchitecture } from '../components/landing/LandingArchitecture';
import { LandingCta } from '../components/landing/LandingCta';
import { LandingFooter } from '../components/landing/LandingFooter';
import { ScrollProgressBar } from '../components/ui/ScrollProgressBar';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize smooth momentum scrolling for the landing page
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Scroll to top on mount
    window.scrollTo(0, 0);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <div className="mg-landing-page" ref={containerRef}>
      {/* Smooth Golden Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Landing Sticky Navigation Bar */}
      <LandingNavbar />

      {/* Main Spacious Content */}
      <main className="mg-landing-page__main">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingArchitecture />
        <LandingCta />
      </main>

      {/* Clean Footer */}
      <LandingFooter />
    </div>
  );
};
