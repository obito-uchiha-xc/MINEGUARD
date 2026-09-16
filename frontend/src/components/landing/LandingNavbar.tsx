import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Activity, HardHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './LandingNavbar.css';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Industrial Nav Links */}
        <nav className="mg-landing-nav__links" aria-label="Mining Platform Navigation">
          <a href="#overview" className="mg-landing-nav__link">Mine Overview</a>
          <a href="#sectors" className="mg-landing-nav__link">Sector Health</a>
          <a href="#capabilities" className="mg-landing-nav__link">Geotechnical Systems</a>
          <a href="#tarp" className="mg-landing-nav__link">TARP Protocols</a>
          <a href="#hardware" className="mg-landing-nav__link">Industrial Hardware</a>
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
              onClick={() => setMobileMenuOpen(false)}
            >
              Mine Overview
            </a>
            <a
              href="#sectors"
              className="mg-landing-nav__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sector Health
            </a>
            <a
              href="#capabilities"
              className="mg-landing-nav__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Geotechnical Systems
            </a>
            <a
              href="#tarp"
              className="mg-landing-nav__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              TARP Protocols
            </a>
            <a
              href="#hardware"
              className="mg-landing-nav__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Industrial Hardware
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
