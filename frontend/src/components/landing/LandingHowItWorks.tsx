import React from 'react';
import { Shield, AlertCircle, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingHowItWorks.css';

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

export const LandingHowItWorks: React.FC = () => {
  const tarpLevels = [
    {
      level: 'TARP 0',
      status: 'NOMINAL BASELINE',
      badgeClass: 'mg-tarp-badge--level0',
      icon: <Shield size={22} className="text-emerald-400" />,
      threshold: 'Creep Velocity < 1.0 mm/day',
      action: 'Continuous 100 Hz background polling, automated thermal compensation, routine daily shift handover reports.',
      protocols: [
        'Routine radar sweeps every 300 seconds',
        'Normal pit haulage and production operations active',
        'Zero geotechnical restrictions enforced',
      ],
    },
    {
      level: 'TARP 1',
      status: 'ADVISORY MONITORING',
      badgeClass: 'mg-tarp-badge--level1',
      icon: <AlertCircle size={22} className="text-blue-400" />,
      threshold: 'Creep Velocity 1.0 - 5.0 mm/day',
      action: 'Automated targeted radar focus on affected bench, increased sampling to 500 Hz, notification sent to shift geotechnical engineer.',
      protocols: [
        'Geotechnical inspection of crest tension cracks within 4 hours',
        'Sympathetic adjacent nodes polled for correlation',
        'Production machinery advised to maintain alert readiness',
      ],
    },
    {
      level: 'TARP 2',
      status: 'ENGINEERING INVESTIGATION',
      badgeClass: 'mg-tarp-badge--level2',
      icon: <AlertTriangle size={22} className="text-amber-400" />,
      threshold: 'Creep Velocity 5.0 - 10.0 mm/hr + Tilt Angle > 1.5°',
      action: 'Multi-sensor consensus verified. Geotechnical engineer must log physical inspection. Non-essential personnel restricted from bench toe.',
      protocols: [
        'Haul trucks reduced to 15 km/h on adjacent ramp',
        'Continuous prism & laser triangulation locked on zone',
        'Supervisory sign-off required to maintain production',
      ],
    },
    {
      level: 'TARP 3',
      status: 'CRITICAL EVACUATION',
      badgeClass: 'mg-tarp-badge--level3',
      icon: <AlertOctagon size={22} className="text-red-400" />,
      threshold: 'Creep Velocity > 10.0 mm/hr (Tertiary Acceleration)',
      action: 'Immediate automated audible sirens, pit radio broadcast override, complete bench and toe evacuation, exclusion barrier erected.',
      protocols: [
        'Zero personnel permitted within 1.5x bench height radius',
        'Fukuzono Inverse Velocity failure timeline broadcast',
        'Emergency response team and mine general manager notified',
      ],
    },
  ];

  return (
    <section className="mg-landing-how" id="tarp">
      <div className="mg-landing-how__container">

        <motion.div className="mg-landing-how__eyebrow" {...fadeUpSoft(0)}>
          <span>OPERATIONAL SAFETY PROTOCOL</span>
        </motion.div>

        <motion.h2 className="mg-landing-how__title" {...fadeUp(0.08)}>
          Trigger Action Response Plan (TARP)
        </motion.h2>

        <motion.p className="mg-landing-how__subtitle" {...fadeUpSoft(0.18)}>
          MineGuard executes standardized, non-alarmist geotechnical TARP frameworks to translate
          raw millimetric deformation into unambiguous, audited mining safety actions.
        </motion.p>

        <div className="mg-landing-how__grid">
          {tarpLevels.map((t, idx) => (
            <motion.div
              key={t.level}
              className="mg-tarp-card"
              {...fadeUp(idx * 0.13)}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
            >
              <motion.div className="mg-tarp-card__top" {...fadeUpSoft(idx * 0.13 + 0.08)}>
                <span className={`mg-tarp-badge ${t.badgeClass}`}>{t.level}</span>
                <div className="mg-tarp-card__icon">{t.icon}</div>
              </motion.div>

              <motion.div
                className="mg-tarp-card__status"
                {...fadeUpSoft(idx * 0.13 + 0.13)}
              >
                {t.status}
              </motion.div>

              <motion.div
                className="mg-tarp-card__threshold mono-telemetry"
                {...fadeUpSoft(idx * 0.13 + 0.17)}
              >
                {t.threshold}
              </motion.div>

              <motion.p
                className="mg-tarp-card__action"
                {...fadeUpSoft(idx * 0.13 + 0.21)}
              >
                {t.action}
              </motion.p>

              <div className="mg-tarp-card__protocols">
                {t.protocols.map((p, i) => (
                  <motion.div
                    key={i}
                    className="mg-tarp-card__protocol-item"
                    {...fadeUpSoft(idx * 0.13 + 0.26 + i * 0.08)}
                  >
                    <CheckCircle2 size={14} className="mg-tarp-card__check" />
                    <span>{p}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
