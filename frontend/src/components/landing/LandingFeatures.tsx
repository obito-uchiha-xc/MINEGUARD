import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radar,
  Network,
  TrendingDown,
  BellRing,
  ArrowUpRight,
  Pickaxe,
  Brain,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingFeatures.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40, scale: 0.96, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  viewport: { once: false, margin: '-40px' },
  transition: {
    duration: 0.75,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

// Lighter variant for small text elements (less blur/travel)
const fadeUpSoft = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: 'blur(3px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: false, margin: '-40px' },
  transition: {
    duration: 0.6,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

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
    {
      id: 'analytics',
      title: 'Predictive Geohazard AI & Kinematic Models',
      route: '/analytics',
      icon: <Brain size={24} className="text-gold-glow" />,
      tag: 'PREDICTIVE AI INFERENCE',
      description:
        'Multi-model ML inference running continuous anomaly detection, Fourier transform vibration analysis, and slip-surface shear predictions prior to observable slope failure.',
      highlights: [
        'Multi-model ensemble (Isolation Forest, LSTM Velocity, Autoencoder)',
        'Ambient blast vibration vs. structural shear discriminators',
        'Zone-by-zone geotechnical risk scoring and hazard classification',
      ],
      linkText: 'Launch Geohazard AI Engine',
    },
    {
      id: 'reports',
      title: 'Statutory DGMS Compliance & Shift Handover Logs',
      route: '/reports',
      icon: <FileText size={24} className="text-gold-glow" />,
      tag: 'STATUTORY COMPLIANCE & AUDIT',
      description:
        'Audit-ready geotechnical shift handover dossiers, DGMS statutory compliance exports, and incident investigation logs with cryptographic chain-of-custody tracking.',
      highlights: [
        'Automated end-of-shift geotechnical handover log generation',
        'Statutory compliance exports formatted to DGMS circular standards',
        'Digital signature workflows with auditable supervisory sign-offs',
      ],
      linkText: 'Access Statutory Reports',
    },
  ];

  return (
    <section className="mg-landing-features" id="capabilities">
      <div className="mg-landing-features__container">
        <div className="mg-landing-features__header">
          <motion.div className="mg-landing-features__eyebrow" {...fadeUpSoft(0)}>
            <Pickaxe size={15} className="text-gold-glow" />
            <span>MINE SAFETY ARCHITECTURE</span>
          </motion.div>

          <motion.h2 className="mg-landing-features__title" {...fadeUp(0.08)}>
            Engineered Mining Geotechnical Systems
          </motion.h2>

          <motion.p className="mg-landing-features__subtitle" {...fadeUpSoft(0.18)}>
            An integrated, fail-safe monitoring suite built for chief geotechnical engineers,
            pit superintendents, and control-room shift supervisors.
          </motion.p>
        </div>

        <div className="mg-landing-features__grid">
          {systems.map((s, idx) => (
            <motion.div
              key={s.id}
              className="mg-feature-card"
              {...fadeUp((idx % 3) * 0.12 + Math.floor(idx / 3) * 0.08)}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
            >
              <motion.div className="mg-feature-card__top" {...fadeUpSoft((idx % 3) * 0.12 + 0.08)}>
                <div className="mg-feature-card__icon-box">{s.icon}</div>
                <span className="mg-feature-card__tag">{s.tag}</span>
              </motion.div>

              <motion.h3
                className="mg-feature-card__title"
                {...fadeUp((idx % 3) * 0.12 + 0.13)}
              >
                {s.title}
              </motion.h3>

              <motion.p
                className="mg-feature-card__desc"
                {...fadeUpSoft((idx % 3) * 0.12 + 0.18)}
              >
                {s.description}
              </motion.p>

              <ul className="mg-feature-card__bullets">
                {s.highlights.map((h, i) => (
                  <motion.li
                    key={i}
                    className="mg-feature-card__bullet-item"
                    {...fadeUpSoft((idx % 3) * 0.12 + 0.22 + i * 0.06)}
                  >
                    <span className="mg-feature-card__bullet-dot" />
                    <span>{h}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                className="mg-feature-card__footer"
                {...fadeUpSoft((idx % 3) * 0.12 + 0.38)}
              >
                <Link to={s.route} className="mg-feature-card__cta">
                  <span>{s.linkText}</span>
                  <ArrowUpRight size={17} />
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
