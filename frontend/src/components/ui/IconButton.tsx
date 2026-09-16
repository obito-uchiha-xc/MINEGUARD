import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ButtonVariant, ButtonSize } from '../../types/theme';
import './IconButton.css';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  title,
  className = '',
  disabled,
  whileHover,
  whileTap,
  transition,
  ...props
}) => {
  const isInteractive = !disabled;

  return (
    <motion.button
      className={`mg-icon-btn mg-icon-btn--${variant} mg-icon-btn--${size} ${className}`}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      disabled={disabled}
      whileHover={isInteractive ? (whileHover ?? { scale: 1.08, y: -1 }) : undefined}
      whileTap={isInteractive ? (whileTap ?? { scale: 0.93 }) : undefined}
      transition={transition ?? { type: 'spring', stiffness: 450, damping: 22 }}
      {...props}
    >
      <span className="mg-icon-btn__inner">{icon}</span>
    </motion.button>
  );
};

