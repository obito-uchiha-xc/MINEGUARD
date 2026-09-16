import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export interface ScrollProgressBarProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ containerRef }) => {
  const { scrollYProgress } = useScroll(containerRef ? { container: containerRef as React.RefObject<HTMLElement> } : {});
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: '0%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2.5px',
        background: 'linear-gradient(90deg, #00C2FF 0%, #F3CA68 50%, #FFFDF8 100%)',
        boxShadow: '0 0 12px rgba(243, 202, 104, 0.6), 0 0 6px rgba(0, 194, 255, 0.4)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};

