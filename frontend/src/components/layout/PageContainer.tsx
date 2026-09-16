import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import './PageContainer.css';

export interface PageContainerProps extends Omit<HTMLMotionProps<'main'>, 'children'> {
  children: React.ReactNode;
  maxWidth?: 'standard' | 'wide' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'wide',
  className = '',
  ...props
}) => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className={`mg-page-container mg-page-container--${maxWidth} ${className}`}
      {...props}
    >
      {children}
    </motion.main>
  );
};
