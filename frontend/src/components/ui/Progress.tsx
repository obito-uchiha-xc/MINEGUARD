import React from 'react';
import type { BadgeVariant } from '../../types/theme';
import './Progress.css';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: BadgeVariant;
  showValue?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'info',
  showValue = false,
  label,
  size = 'md',
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`mg-progress-container ${className}`} {...props}>
      {(label || showValue) && (
        <div className="mg-progress-meta">
          {label && <span className="mg-progress-label">{label}</span>}
          {showValue && (
            <span className="mg-progress-value mono-telemetry">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`mg-progress-track mg-progress-track--${size}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={`mg-progress-bar mg-progress-bar--${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
