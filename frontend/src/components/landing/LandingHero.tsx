import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  HardHat,
  Radar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingHero.css';

export const LandingHero: React.FC = () => {
  return (
    <section className="mg-landing-hero" id="overview">
      <div className="mg-landing-hero__container">
        {/* Top Industrial Mission Badge */}
        <motion.div
          className="mg-landing-hero__badge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="mg-landing-hero__badge-pulse" />
          <span className="mg-landing-hero__badge-text">
            DGMS & MSHA TITLE 30 COMPLIANT • REAL-TIME MINE SUBSIDENCE MONITORING
          </span>
        </motion.div>

        {/* Primary Mining Headline */}
        <motion.h1
          className="mg-landing-hero__title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Continuous Ground Deformation &amp;
          <span className="mg-landing-hero__title-gold gold-gradient-text">
            Slope Failure Early Warning
          </span>
        </motion.h1>

        {/* Professional Geotechnical Subtitle */}
        <motion.p
          className="mg-landing-hero__subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Engineered for open-pit highwalls, underground longwall galleries, and tailings dam
          embankments. MINEGUARD fuses sub-millimeter optical laser interferometry, 9-DOF MEMS
          inclinometers, and seismic consensus algorithms to execute automated Trigger Action
          Response Plans (TARPs) hours before catastrophic ground collapse.
        </motion.p>

        {/* Industrial Action CTAs */}
        <motion.div
          className="mg-landing-hero__cta-group"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to="/dashboard" className="mg-hero-btn mg-hero-btn--primary">
            <HardHat size={18} />
            <span>Launch Mission Control Room</span>
            <ArrowRight size={18} />
          </Link>

          <Link to="/live-map" className="mg-hero-btn mg-hero-btn--secondary">
            <Radar size={18} />
            <span>Open 3D Geotechnical Twin</span>
          </Link>

          <Link to="/alerts" className="mg-hero-btn mg-hero-btn--alert">
            <span className="mg-hero-btn__alert-dot" />
            <span>TARP Level 3 Alert: Zone B2 (Bench 4)</span>
          </Link>
        </motion.div>

        {/* Live Mine Sector Health Board (Authentic Geotechnical Monitoring View) */}
        <motion.div
          className="mg-landing-hero__board"
          id="sectors"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Board Header with Telemetry Stats */}
          <div className="mg-board__header">
            <div className="mg-board__live-chip">
              <span className="mg-board__pulse-dot" />
              <span>STATION MASTER GEOTECHNICAL MONITOR</span>
            </div>
            <div className="mg-board__telemetry-meta">
              <span className="mono-telemetry">PIT LEVEL: -420M</span>
              <span className="mg-board__divider">|</span>
              <span className="mono-telemetry">MAX STRAIN: +12.4 MM/HR</span>
              <span className="mg-board__divider">|</span>
              <span className="mono-telemetry">RADAR SWEEP: 300S CYCLES</span>
            </div>
          </div>

          {/* Sector Overview Columns */}
          <div className="mg-board__sectors-grid">
            {/* Sector A */}
            <div className="mg-sector-panel">
              <div className="mg-sector-panel__top">
                <div className="mg-sector-panel__badge mg-sector-panel__badge--normal">
                  TARP 0 • NOMINAL
                </div>
                <span className="mono-telemetry mg-sector-panel__id">SECTOR A</span>
              </div>
              <h3 className="mg-sector-panel__name">East Pit Highwall (Bench 1-3)</h3>
              <div className="mg-sector-panel__readings">
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Creep Velocity</span>
                  <span className="mg-reading-val mono-telemetry text-emerald-400">0.02 mm/day</span>
                </div>
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Slope Angle</span>
                  <span className="mg-reading-val mono-telemetry">54.2°</span>
                </div>
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Monitored Nodes</span>
                  <span className="mg-reading-val mono-telemetry">N01, N02, N03</span>
                </div>
              </div>
              <div className="mg-sector-panel__status">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Zero structural slip detected. Stable baseline.</span>
              </div>
            </div>

            {/* Sector B - Critical Active Anomaly */}
            <div className="mg-sector-panel mg-sector-panel--critical">
              <div className="mg-sector-panel__top">
                <div className="mg-sector-panel__badge mg-sector-panel__badge--critical">
                  TARP 3 • CRITICAL HAZARD
                </div>
                <span className="mono-telemetry mg-sector-panel__id text-amber-400">SECTOR B</span>
              </div>
              <h3 className="mg-sector-panel__name">South Slope (Bench 4 - Zone B2)</h3>
              <div className="mg-sector-panel__readings">
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Creep Velocity</span>
                  <span className="mg-reading-val mono-telemetry text-amber-400 font-bold">+12.4 mm/hr</span>
                </div>
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Tilt Deviation</span>
                  <span className="mg-reading-val mono-telemetry text-amber-400">+2.84° (Roll)</span>
                </div>
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Trigger Node</span>
                  <span className="mg-reading-val mono-telemetry text-amber-400">Node N04 (MG-0042)</span>
                </div>
              </div>
              <div className="mg-sector-panel__status mg-sector-panel__status--alert">
                <AlertTriangle size={14} className="text-amber-400" />
                <span>Multi-sensor consensus verified. Haulage road restricted.</span>
              </div>
            </div>

            {/* Sector C */}
            <div className="mg-sector-panel">
              <div className="mg-sector-panel__top">
                <div className="mg-sector-panel__badge mg-sector-panel__badge--normal">
                  TARP 0 • NOMINAL
                </div>
                <span className="mono-telemetry mg-sector-panel__id">SECTOR C</span>
              </div>
              <h3 className="mg-sector-panel__name">Shaft Pillar 2 &amp; Gallery Entry</h3>
              <div className="mg-sector-panel__readings">
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Roof Convergence</span>
                  <span className="mg-reading-val mono-telemetry text-emerald-400">0.04 mm/day</span>
                </div>
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Pore Water Press.</span>
                  <span className="mg-reading-val mono-telemetry">142.6 kPa</span>
                </div>
                <div className="mg-sector-panel__reading">
                  <span className="mg-reading-label">Monitored Nodes</span>
                  <span className="mg-reading-val mono-telemetry">N09, N10, N11, N12</span>
                </div>
              </div>
              <div className="mg-sector-panel__status">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Hydraulic roof supports within nominal limits.</span>
              </div>
            </div>
          </div>

          {/* Board Footer with Deep Navigation */}
          <div className="mg-board__footer">
            <span className="mg-board__footer-title">
              Direct Geotechnical Console Links:
            </span>
            <div className="mg-board__links">
              <Link to="/live-map" className="mg-board__link">
                <span>Inspect Spatial Heatmap</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/nodes" className="mg-board__link">
                <span>View Node N04 Inclinometer</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/data-trends" className="mg-board__link">
                <span>Inverse Velocity Plot (1/v)</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/alerts" className="mg-board__link">
                <span>TARP Response Checklist</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
