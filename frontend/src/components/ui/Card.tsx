import React from 'react';
import type { CardVariant } from '../../types/theme';
import './Card.css';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CardVariant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  statusBadge?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  subtitle,
  icon,
  action,
  statusBadge,
  footer,
  children,
  noPadding = false,
  className = '',
  ...props
}) => {
  const hasHeader = Boolean(title || subtitle || icon || action || statusBadge);

  return (
    <div
      className={`mg-card mg-card--${variant} ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="mg-card__header">
          <div className="mg-card__title-group">
            {icon && <span className="mg-card__icon">{icon}</span>}
            <div className="mg-card__headings">
              {title && <h3 className="mg-card__title">{title}</h3>}
              {subtitle && <p className="mg-card__subtitle">{subtitle}</p>}
            </div>
          </div>
          {(action || statusBadge) && (
            <div className="mg-card__actions">
              {statusBadge}
              {action}
            </div>
          )}
        </div>
      )}
      <div className={`mg-card__body ${noPadding ? 'mg-card__body--no-padding' : ''}`}>
        {children}
      </div>
      {footer && <div className="mg-card__footer">{footer}</div>}
    </div>
  );
};
