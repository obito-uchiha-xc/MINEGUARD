import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Activity, HardHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './LandingNavbar.css';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth Lenis Anchor Navigation Gliding with -70px header offset compensation
  const handleScrollTo = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: { scrollTo: (target: Element, options?: { offset?: number; duration?: number }) => void } }).__lenis;
    const el = document.querySelector(targetId);
    if (lenis && el) {
      lenis.scrollTo(el, { offset: -70, duration: 1.2 });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="mg-landing-nav">
      <div className="mg-landing-nav__container">
        {/* Mining Industrial Brand */}
        <Link to="/" className="mg-landing-nav__brand">
          <div className="mg-landing-nav__logo-box">
            <HardHat size={22} className="mg-landing-nav__logo-icon" />
          </div>
          <div className="mg-landing-nav__brand-info">
            <div className="mg-landing-nav__brand-title">
              <span className="mg-landing-nav__brand-name">MINEGUARD</span>
              <span className="mg-landing-nav__brand-pill">GEOTECH CORE</span>
            </div>
            <span className="mg-landing-nav__brand-tag">Subsidence & Slope Stability System</span>
          </div>
        </Link>

        {/* Industrial Nav Links with Lenis Glide */}
        <nav className="mg-landing-nav__links" aria-label="Mining Platform Navigation">
          <a href="#overview" onClick={(e) => handleScrollTo(e, '#overview')} className="mg-landing-nav__link">Mine Overview</a>
          <a href="#sectors" onClick={(e) => handleScrollTo(e, '#sectors')} className="mg-landing-nav__link">Sector Health</a>
          <a href="#capabilities" onClick={(e) => handleScrollTo(e, '#capabilities')} className="mg-landing-nav__link">Geotechnical Systems</a>
          <a href="#tarp" onClick={(e) => handleScrollTo(e, '#tarp')} className="mg-landing-nav__link">TARP Protocols</a>
          <a href="#hardware" onClick={(e) => handleScrollTo(e, '#hardware')} className="mg-landing-nav__link">Industrial Hardware</a>
        </nav>

        {/* Action Button & Live Telemetry Pill */}
        <div className="mg-landing-nav__actions">
          <div className="mg-landing-nav__status-indicator" title="All 12 IoT Geotechnical Nodes Transmitting">
            <Activity size={14} className="mg-landing-nav__pulse-icon" />
            <span className="mono-telemetry">12/12 NODES ONLINE</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="mg-landing-nav__toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mg-landing-nav__mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <a
              href="#overview"
              className="mg-landing-nav__mobile-link"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollTo(e, '#overview');
              }}
            >
              Mine Overview
            </a>
            <a
              href="#sectors"
              className="mg-landing-nav__mobile-link"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollTo(e, '#sectors');
              }}
            >
              Sector Health
            </a>
            <a
              href="#capabilities"
              className="mg-landing-nav__mobile-link"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollTo(e, '#capabilities');
              }}
            >
              Geotechnical Systems
            </a>
            <a
              href="#tarp"
              className="mg-landing-nav__mobile-link"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollTo(e, '#tarp');
              }}
            >
              TARP Protocols
            </a>
            <a
              href="#hardware"
              className="mg-landing-nav__mobile-link"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollTo(e, '#hardware');
              }}
            >
              Industrial Hardware
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
