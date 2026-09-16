import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import './LandingFooter.css';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="mg-landing-footer">
      <div className="mg-landing-footer__container">
        <div className="mg-landing-footer__top">
          {/* Mining Brand & Authority */}
          <div className="mg-landing-footer__brand-col">
            <div className="mg-landing-footer__brand">
              <div className="mg-landing-footer__logo-box">
                <HardHat size={20} className="text-gold-glow" />
              </div>
              <span className="mg-landing-footer__name">MINEGUARD</span>
            </div>
            <p className="mg-landing-footer__tagline">
              Sense. Predict. Protect.
            </p>
            <p className="mg-landing-footer__bio">
              Industrial real-time mine subsidence monitoring and slope stability early warning
              platform designed to safeguard pit personnel, heavy machinery, and geotechnical assets.
            </p>
          </div>

          {/* Mission Control Navigation */}
          <div className="mg-landing-footer__links-col">
            <span className="mg-landing-footer__heading">Control Room Console</span>
            <div className="mg-landing-footer__link-list">
              <Link to="/dashboard" className="mg-landing-footer__link">Surface Control Center</Link>
              <Link to="/live-map" className="mg-landing-footer__link">3D Geotechnical Twin</Link>
              <Link to="/nodes" className="mg-landing-footer__link">In-Situ Sensor Matrix</Link>
              <Link to="/data-trends" className="mg-landing-footer__link">Inverse Velocity Trends</Link>
              <Link to="/alerts" className="mg-landing-footer__link">TARP Alert Center</Link>
            </div>
          </div>

          {/* Operational Engineering Tools */}
          <div className="mg-landing-footer__links-col">
            <span className="mg-landing-footer__heading">Operations &amp; Compliance</span>
            <div className="mg-landing-footer__link-list">
              <Link to="/reports" className="mg-landing-footer__link">Daily Geotechnical Shift Logs</Link>
              <Link to="/analytics" className="mg-landing-footer__link">Highwall Stability Models</Link>
              <Link to="/settings" className="mg-landing-footer__link">TARP Trigger Thresholds</Link>
              <Link to="/users" className="mg-landing-footer__link">Operator Role &amp; Access</Link>
            </div>
          </div>

          {/* Real-Time Geotechnical Station Status */}
          <div className="mg-landing-footer__status-col">
            <span className="mg-landing-footer__heading">Station Telemetry Status</span>
            <div className="mg-landing-footer__status-box">
              <div className="mg-landing-footer__status-row">
                <span className="mg-landing-footer__live-dot" />
                <span className="mg-landing-footer__status-title">Surface Mesh Synchronized</span>
              </div>
              <p className="mg-landing-footer__status-detail">
                12 IoT Nodes transmitting via 915 MHz LoRa / 2.4 GHz mesh at 100 Hz continuous rate.
              </p>
            </div>
          </div>
        </div>

        {/* Industrial Footer Bottom */}
        <div className="mg-landing-footer__bottom">
          <span className="mg-landing-footer__copy">
            © 2026 MINEGUARD Systems. Real-Time Geotechnical Safety Division. All rights reserved.
          </span>
          <div className="mg-landing-footer__compliance">
            <span>DGMS Approved Protocol</span>
            <span>•</span>
            <span>MSHA Title 30 CFR</span>
            <span>•</span>
            <span>ISO-19434 Geotechnical Rigor</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
