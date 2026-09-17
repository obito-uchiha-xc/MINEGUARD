import React from 'react';
import { Target, Activity, ShieldAlert, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingStats.css';

// Premium smooth entrance: blur + scale + float up
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
              {...fadeUp(idx * 0.13)}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
            >
              <motion.div
                className="mg-landing-stats__icon-box"
                {...fadeUp(idx * 0.13 + 0.08)}
              >
                {stat.icon}
              </motion.div>

              <motion.div
                className="mg-landing-stats__val text-gold-glow mono-telemetry"
                {...fadeUp(idx * 0.13 + 0.13)}
              >
                {stat.value}
              </motion.div>

              <motion.div
                className="mg-landing-stats__label"
                {...fadeUp(idx * 0.13 + 0.18)}
              >
                {stat.label}
              </motion.div>

              <motion.p
                className="mg-landing-stats__desc"
                {...fadeUp(idx * 0.13 + 0.22)}
              >
                {stat.desc}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
