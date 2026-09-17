import React from 'react';
import { Target, Activity, ShieldAlert, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingStats.css';

export const LandingStats: React.FC = () => {
  const stats = [
    {
      icon: <Target size={22} className="text-gold-glow" />,
      value: '±0.05 mm',
      label: 'Optical Creep Precision',
      desc: 'Sub-millimeter laser interferometry detecting early tertiary shear strain.',
    },
    {
      icon: <Activity size={22} className="text-gold-glow" />,
      value: '100 Hz',
      label: 'Dynamic Seismic Burst Rate',
      desc: 'Triaxial MEMS geophones isolating heavy production blast shockwaves.',
    },
    {
      icon: <Mountain size={22} className="text-gold-glow" />,
      value: '-420 m',
      label: 'Subterranean Stope Depth',
      desc: 'Continuous dual-hop mesh routing across deep shaft pillars and haulageways.',
    },
    {
      icon: <ShieldAlert size={22} className="text-gold-glow" />,
      value: 'TARP L3',
      label: 'Automated Response Trigger',
      desc: 'Multi-sensor consensus dispatching sirens and radio cut-ins before rockfall.',
    },
  ];

  return (
    <section className="mg-landing-stats">
      <div className="mg-landing-stats__container">
        <div className="mg-landing-stats__grid">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="mg-landing-stats__card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.55,
                delay: idx * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mg-landing-stats__icon-box">{stat.icon}</div>
              <div className="mg-landing-stats__val text-gold-glow mono-telemetry">
                {stat.value}
              </div>
              <div className="mg-landing-stats__label">{stat.label}</div>
              <p className="mg-landing-stats__desc">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
