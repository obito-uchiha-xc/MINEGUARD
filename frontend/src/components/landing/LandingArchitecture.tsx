import React from 'react';
import { ShieldCheck, HardHat, Cpu, Radio, BatteryCharging, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingArchitecture.css';

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

export const LandingArchitecture: React.FC = () => {
  const specs = [
    {
      icon: <HardHat size={20} className="text-gold-glow" />,
      title: 'ATEX / IECEx Explosion-Proof Housings',
      desc: 'Heavy-duty IP67 pressurized die-cast alloy enclosures engineered for hazardous methane, coal dust, and corrosive acid mine drainage environments.',
    },
    {
      icon: <Cpu size={20} className="text-gold-glow" />,
      title: 'Class 3R Optical Laser Triangulation',
      desc: 'Sub-millimeter optical distance measurement capable of resolving ±0.05 mm bench creep at ranges up to 250 meters without physical prisms.',
    },
    {
      icon: <Radio size={20} className="text-gold-glow" />,
      title: 'Sub-GHz & 2.4 GHz Subterranean Mesh',
      desc: 'Dynamic self-healing LoRa/BLE mesh designed to penetrate rock strata and underground gallery shafts with zero line-of-sight dropouts.',
    },
    {
      icon: <BatteryCharging size={20} className="text-gold-glow" />,
      title: '180-Day Dark Stope Energy Buffer',
      desc: 'Industrial LiFePO4 battery pack coupled with monocrystalline solar harvesting, ensuring uninterrupted operation during power blackouts.',
    },
    {
      icon: <ShieldCheck size={20} className="text-gold-glow" />,
      title: 'DGMS & MSHA Title 30 Compliance',
      desc: 'Exceeds statutory open-pit and underground geotechnical safety regulations, bench stability thresholds, and mandatory shift audits.',
    },
    {
      icon: <FileCheck size={20} className="text-gold-glow" />,
      title: 'Cryptographic Station Master Audit Logs',
      desc: 'Immutable append-only event logging of operator TARP acknowledgments, engineering notes, and supervisory evacuation sign-offs.',
    },
  ];

  return (
    <section className="mg-landing-arch" id="hardware">
      <div className="mg-landing-arch__container">

        <motion.div className="mg-landing-arch__eyebrow" {...fadeUpSoft(0)}>
          <span>INDUSTRIAL RIGOR</span>
        </motion.div>

        <motion.h2 className="mg-landing-arch__title" {...fadeUp(0.08)}>
          Engineered for Extreme Mining Environments
        </motion.h2>

        <motion.p className="mg-landing-arch__subtitle" {...fadeUpSoft(0.18)}>
          Every MineGuard sensor node and mesh gateway is certified to withstand explosive dust,
          heavy blast vibrations, acid water, and extreme subterranean temperatures.
        </motion.p>

        <div className="mg-landing-arch__grid">
          {specs.map((s, idx) => (
            <motion.div
              key={idx}
              className="mg-arch-card"
              {...fadeUp(idx * 0.11)}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
            >
              <motion.div
                className="mg-arch-card__icon"
                {...fadeUpSoft(idx * 0.11 + 0.08)}
              >
                {s.icon}
              </motion.div>

              <motion.h3
                className="mg-arch-card__title"
                {...fadeUp(idx * 0.11 + 0.12)}
              >
                {s.title}
              </motion.h3>

              <motion.p
                className="mg-arch-card__desc"
                {...fadeUpSoft(idx * 0.11 + 0.17)}
              >
                {s.desc}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
