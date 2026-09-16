import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HardHat, Radar } from 'lucide-react';
import './LandingCta.css';

export const LandingCta: React.FC = () => {
  return (
    <section className="mg-landing-cta">
      <div className="mg-landing-cta__container">
        <div className="mg-landing-cta__box">
          <div className="mg-landing-cta__badge">
            <HardHat size={16} className="text-gold-glow" />
            <span>OPERATIONAL SAFETY DEPLOYMENT</span>
          </div>

          <h2 className="mg-landing-cta__title">
            Protect Mine Personnel &amp; Assets from Unforeseen Ground Failure
          </h2>

          <p className="mg-landing-cta__subtitle">
            Deploy MineGuard's fail-safe geotechnical monitoring platform across your open-pit benches,
            underground stope galleries, and tailings storage facilities. Experience zero false alarms
            and verifiable multi-sensor consensus early warnings.
          </p>

          <div className="mg-landing-cta__actions">
            <Link to="/dashboard" className="mg-cta-btn mg-cta-btn--primary">
              <HardHat size={18} />
              <span>Enter Mission Control Room</span>
              <ArrowRight size={18} />
            </Link>

            <Link to="/live-map" className="mg-cta-btn mg-cta-btn--secondary">
              <Radar size={18} />
              <span>Inspect 3D Geotechnical Twin</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
