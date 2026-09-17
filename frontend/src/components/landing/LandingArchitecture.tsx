import React from 'react';
import { ShieldCheck, HardHat, Cpu, Radio, BatteryCharging, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingArchitecture.css';

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
        <motion.div
          className="mg-landing-arch__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mg-landing-arch__eyebrow">
            <span>INDUSTRIAL RIGOR</span>
          </div>
          <h2 className="mg-landing-arch__title">
            Engineered for Extreme Mining Environments
          </h2>
          <p className="mg-landing-arch__subtitle">
            Every MineGuard sensor node and mesh gateway is certified to withstand explosive dust,
            heavy blast vibrations, acid water, and extreme subterranean temperatures.
          </p>
        </motion.div>

        <div className="mg-landing-arch__grid">
          {specs.map((s, idx) => (
            <motion.div
              key={idx}
              className="mg-arch-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mg-arch-card__icon">{s.icon}</div>
              <h3 className="mg-arch-card__title">{s.title}</h3>
              <p className="mg-arch-card__desc">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
