import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radar,
  Network,
  TrendingDown,
  BellRing,
  ArrowUpRight,
  Pickaxe,
} from 'lucide-react';
import './LandingFeatures.css';

export const LandingFeatures: React.FC = () => {
  const systems = [
    {
      id: 'live-map',
      title: '3D Spatial Geotechnical Digital Twin',
      route: '/live-map',
      icon: <Radar size={24} className="text-gold-glow" />,
      tag: 'SLOPE STABILITY RADAR & INSAR',
      description:
        'Continuous 3D topological pit mapping integrating bench contour elevations, real-time vector creep arrows, and danger polygon geofencing across open-pit highwalls and tailings dams.',
      highlights: [
        'Real-time deformation heatmaps (Critical, Warning, Nominal)',
        'Bench-level contour layers and structural fault line overlays',
        'Node drilldown with automated camera fly-to animations',
      ],
      linkText: 'Inspect 3D Geotechnical Twin',
    },
    {
      id: 'nodes',
      title: 'Subterranean & Pit In-Situ Sensor Matrix',
      route: '/nodes',
      icon: <Network size={24} className="text-gold-glow" />,
      tag: 'IOT GEOTECHNICAL HARDWARE',
      description:
        'Telemetry monitoring for all 12 edge-deployed nodes tracking Class 3R optical laser displacement, 9-DOF MPU-6500 MEMS inclinometers, SW-1801P blast geophones, and pore-water pressure.',
      highlights: [
        'Hardware link RSSI, solar battery health & temperature compensation',
        'Physical coordinate surveying & geological zone mapping',
        'Direct link to individual node FFT spectra and alert logs',
      ],
      linkText: 'Monitor In-Situ Sensor Matrix',
    },
    {
      id: 'data-trends',
      title: 'Tertiary Creep & Inverse Velocity Analytics',
      route: '/data-trends',
      icon: <TrendingDown size={24} className="text-gold-glow" />,
      tag: 'FAILURE PREDICTION ENGINE',
      description:
        'Empirical time-to-failure forecasting utilizing the Fukuzono Inverse Velocity method (1/v → 0), rate-of-change derivatives, multi-parameter cross-plotting, and compliance CSV log exports.',
      highlights: [
        'Comparative multi-metric timelines (1h, 24h, 7d, 30d, 90d)',
        'Rate-of-change velocity calculus detecting accelerated shear',
        'High-density telemetry export for regulatory DGMS audits',
      ],
      linkText: 'Analyze Creep & Velocity Curves',
    },
    {
      id: 'alerts',
      title: 'TARP Early Warning & Evacuation Center',
      route: '/alerts',
      icon: <BellRing size={24} className="text-gold-glow" />,
      tag: 'TRIGGER ACTION RESPONSE PLAN',
      description:
        'Autonomous early warning dispatch executing graduated Trigger Action Response Plans (TARPs). Validates multi-sensor consensus to eliminate false alarms and issues audited supervisory actions.',
      highlights: [
        'Non-alarmist physical deformation explainability reports',
        'Spatial cluster correlation with adjacent sympathetic benches',
        'Operational lifecycle tracking (New → Investigating → Resolved)',
      ],
      linkText: 'Open TARP Response Center',
    },
  ];

  return (
    <section className="mg-landing-features" id="capabilities">
      <div className="mg-landing-features__container">
        {/* Industrial Section Header */}
        <div className="mg-landing-features__header">
          <div className="mg-landing-features__eyebrow">
            <Pickaxe size={15} className="text-gold-glow" />
            <span>MINE SAFETY ARCHITECTURE</span>
          </div>
          <h2 className="mg-landing-features__title">
            Engineered Mining Geotechnical Systems
          </h2>
          <p className="mg-landing-features__subtitle">
            An integrated, fail-safe monitoring suite built for chief geotechnical engineers,
            pit superintendents, and control-room shift supervisors.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="mg-landing-features__grid">
          {systems.map((s) => (
            <div key={s.id} className="mg-feature-card">
              <div className="mg-feature-card__top">
                <div className="mg-feature-card__icon-box">{s.icon}</div>
                <span className="mg-feature-card__tag">{s.tag}</span>
              </div>

              <h3 className="mg-feature-card__title">{s.title}</h3>
              <p className="mg-feature-card__desc">{s.description}</p>

              <ul className="mg-feature-card__bullets">
                {s.highlights.map((h, i) => (
                  <li key={i} className="mg-feature-card__bullet-item">
                    <span className="mg-feature-card__bullet-dot" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mg-feature-card__footer">
                <Link to={s.route} className="mg-feature-card__cta">
                  <span>{s.linkText}</span>
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
