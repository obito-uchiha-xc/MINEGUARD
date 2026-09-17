import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingFooter.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40, scale: 0.96, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  viewport: { once: false, margin: '-30px' },
  transition: {
    duration: 0.75,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

const fadeUpSoft = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: 'blur(3px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: false, margin: '-30px' },
  transition: {
    duration: 0.6,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

export const LandingFooter: React.FC = () => {
  const controlLinks = [
    { label: 'Surface Control Center', to: '/dashboard' },
    { label: '3D Geotechnical Twin', to: '/live-map' },
    { label: 'In-Situ Sensor Matrix', to: '/nodes' },
    { label: 'Inverse Velocity Trends', to: '/data-trends' },
    { label: 'TARP Alert Center', to: '/alerts' },
  ];

  const opsLinks = [
    { label: 'Daily Geotechnical Shift Logs', to: '/reports' },
    { label: 'Highwall Stability Models', to: '/analytics' },
    { label: 'TARP Trigger Thresholds', to: '/settings' },
    { label: 'Operator Role & Access', to: '/users' },
  ];

  return (
    <footer className="mg-landing-footer">
      <div className="mg-landing-footer__container">
        <div className="mg-landing-footer__top">

          {/* Brand column */}
          <motion.div className="mg-landing-footer__brand-col" {...fadeUp(0)}>
            <motion.div className="mg-landing-footer__brand" {...fadeUpSoft(0.06)}>
              <div className="mg-landing-footer__logo-box">
                <HardHat size={20} className="text-gold-glow" />
              </div>
              <span className="mg-landing-footer__name">MINEGUARD</span>
            </motion.div>
            <motion.p className="mg-landing-footer__tagline" {...fadeUpSoft(0.12)}>
              Sense. Predict. Protect.
            </motion.p>
            <motion.p className="mg-landing-footer__bio" {...fadeUpSoft(0.18)}>
              Industrial real-time mine subsidence monitoring and slope stability early warning
              platform designed to safeguard pit personnel, heavy machinery, and geotechnical assets.
            </motion.p>
          </motion.div>

          {/* Control Room links */}
          <motion.div className="mg-landing-footer__links-col" {...fadeUp(0.1)}>
            <motion.span className="mg-landing-footer__heading" {...fadeUpSoft(0.16)}>
              Control Room Console
            </motion.span>
            <div className="mg-landing-footer__link-list">
              {controlLinks.map((l, i) => (
                <motion.div key={l.label} {...fadeUpSoft(0.22 + i * 0.07)}>
                  <Link to={l.to} className="mg-landing-footer__link">{l.label}</Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Operations links */}
          <motion.div className="mg-landing-footer__links-col" {...fadeUp(0.18)}>
            <motion.span className="mg-landing-footer__heading" {...fadeUpSoft(0.24)}>
              Operations &amp; Compliance
            </motion.span>
            <div className="mg-landing-footer__link-list">
              {opsLinks.map((l, i) => (
                <motion.div key={l.label} {...fadeUpSoft(0.3 + i * 0.07)}>
                  <Link to={l.to} className="mg-landing-footer__link">{l.label}</Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status column */}
          <motion.div className="mg-landing-footer__status-col" {...fadeUp(0.24)}>
            <motion.span className="mg-landing-footer__heading" {...fadeUpSoft(0.3)}>
              Station Telemetry Status
            </motion.span>
            <motion.div className="mg-landing-footer__status-box" {...fadeUpSoft(0.36)}>
              <div className="mg-landing-footer__status-row">
                <span className="mg-landing-footer__live-dot" />
                <span className="mg-landing-footer__status-title">Surface Mesh Synchronized</span>
              </div>
              <p className="mg-landing-footer__status-detail">
                12 IoT Nodes transmitting via 915 MHz LoRa / 2.4 GHz mesh at 100 Hz continuous rate.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div className="mg-landing-footer__bottom" {...fadeUpSoft(0.3)}>
          <motion.span className="mg-landing-footer__copy" {...fadeUpSoft(0.36)}>
            © 2026 MINEGUARD Systems. Real-Time Geotechnical Safety Division. All rights reserved.
          </motion.span>
          <motion.div className="mg-landing-footer__compliance" {...fadeUpSoft(0.42)}>
            <span>DGMS Approved Protocol</span>
            <span>•</span>
            <span>MSHA Title 30 CFR</span>
            <span>•</span>
            <span>ISO-19434 Geotechnical Rigor</span>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};
