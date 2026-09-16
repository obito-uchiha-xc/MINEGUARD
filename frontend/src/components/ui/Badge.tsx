import React from 'react';
import type { BadgeVariant } from '../../types/theme';
import type { SafetyStatus } from '../../types/safety';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: SafetyStatus;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  status,
  dot = false,
  pulse = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  // If a SafetyStatus is passed directly, map to the corresponding variant
  let resolvedVariant = variant || 'neutral';
  if (status) {
    switch (status) {
      case 'NORMAL':
        resolvedVariant = 'normal';
        break;
      case 'WARNING':
        resolvedVariant = 'warning';
        break;
      case 'HIGH_RISK':
        resolvedVariant = 'high_risk';
        break;
      case 'CRITICAL':
        resolvedVariant = 'critical';
        break;
      case 'OFFLINE':
        resolvedVariant = 'offline';
        break;
      case 'LIVE':
        resolvedVariant = 'info';
        break;
      case 'DELAYED':
        resolvedVariant = 'warning';
        break;
    }
  }

  return (
    <span
      className={`mg-badge mg-badge--${resolvedVariant} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`mg-badge__dot ${pulse ? 'mg-badge__dot--pulse' : ''}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="mg-badge__icon">{icon}</span>}
      <span className="mg-badge__text">{children}</span>
    </span>
  );
};
