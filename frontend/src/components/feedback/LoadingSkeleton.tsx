import React from 'react';
import './LoadingSkeleton.css';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'metric' | 'table' | 'chart';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style,
  ...props
}) => {
  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'metric') {
    return (
      <div className={`mg-skeleton-metric ${className}`}>
        <div className="mg-skeleton mg-skeleton--text" style={{ width: '40%', height: '14px' }} />
        <div className="mg-skeleton mg-skeleton--rect" style={{ width: '70%', height: '32px', margin: '8px 0' }} />
        <div className="mg-skeleton mg-skeleton--text" style={{ width: '55%', height: '12px' }} />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`mg-skeleton-card ${className}`}>
        <div className="mg-skeleton-card__header">
          <div className="mg-skeleton mg-skeleton--circle" style={{ width: '28px', height: '28px' }} />
          <div className="mg-skeleton mg-skeleton--text" style={{ width: '50%', height: '16px' }} />
        </div>
        <div className="mg-skeleton-card__body">
          <div className="mg-skeleton mg-skeleton--rect" style={{ width: '100%', height: '70px' }} />
          <div className="mg-skeleton mg-skeleton--text" style={{ width: '80%', height: '14px', marginTop: '12px' }} />
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`mg-skeleton-chart ${className}`}>
        <div className="mg-skeleton-chart__bars">
          {[40, 65, 30, 80, 50, 90, 70, 45].map((h, i) => (
            <div
              key={i}
              className="mg-skeleton mg-skeleton--rect mg-skeleton-chart__bar"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`mg-skeleton mg-skeleton--${variant} ${className}`}
          style={customStyle}
          aria-hidden="true"
          {...props}
        />
      ))}
    </>
  );
};
