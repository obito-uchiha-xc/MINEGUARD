import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ButtonVariant, ButtonSize } from '../../types/theme';
import { Loader2 } from 'lucide-react';
import './Button.css';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  whileHover,
  whileTap,
  transition,
  ...props
}) => {
  const isInteractive = !disabled && !isLoading;

  return (
    <motion.button
      className={`mg-btn mg-btn--${variant} mg-btn--${size} ${isLoading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      whileHover={isInteractive ? (whileHover ?? { scale: 1.02, y: -1.5 }) : undefined}
      whileTap={isInteractive ? (whileTap ?? { scale: 0.97 }) : undefined}
      transition={transition ?? { type: 'spring', stiffness: 400, damping: 22 }}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mg-btn__spinner" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : (
        leftIcon && <span className="mg-btn__icon mg-btn__icon--left">{leftIcon}</span>
      )}
      {children && <span className="mg-btn__label">{children}</span>}
      {!isLoading && rightIcon && (
        <span className="mg-btn__icon mg-btn__icon--right">{rightIcon}</span>
      )}
    </motion.button>
  );
};

