import React from 'react';
import { Shield, AlertCircle, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingHowItWorks.css';

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
        <motion.div
          className="mg-landing-how__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mg-landing-how__eyebrow">
            <span>OPERATIONAL SAFETY PROTOCOL</span>
          </div>
          <h2 className="mg-landing-how__title">
            Trigger Action Response Plan (TARP)
          </h2>
          <p className="mg-landing-how__subtitle">
            MineGuard executes standardized, non-alarmist geotechnical TARP frameworks to translate
            raw millimetric deformation into unambiguous, audited mining safety actions.
          </p>
        </motion.div>

        <div className="mg-landing-how__grid">
          {tarpLevels.map((t, idx) => (
            <motion.div
              key={t.level}
              className="mg-tarp-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.6,
                delay: idx * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mg-tarp-card__top">
                <span className={`mg-tarp-badge ${t.badgeClass}`}>{t.level}</span>
                <div className="mg-tarp-card__icon">{t.icon}</div>
              </div>

              <div className="mg-tarp-card__status">{t.status}</div>
              <div className="mg-tarp-card__threshold mono-telemetry">{t.threshold}</div>
              <p className="mg-tarp-card__action">{t.action}</p>

              <div className="mg-tarp-card__protocols">
                {t.protocols.map((p, i) => (
                  <div key={i} className="mg-tarp-card__protocol-item">
                    <CheckCircle2 size={14} className="mg-tarp-card__check" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
