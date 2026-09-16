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
        background: 'linear-gradient(90deg, #c78824 0%, #e5a93c 50%, #f3ba4f 100%)',
        boxShadow: '0 0 10px rgba(229, 169, 60, 0.6), 0 0 20px rgba(229, 169, 60, 0.3)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};

