import React from 'react';
import './PageHeader.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`mg-page-header ${className}`}>
      <div className="mg-page-header__main">
        <div className="mg-page-header__title-row">
          <h1 className="mg-page-header__title">{title}</h1>
          {badge && <div className="mg-page-header__badge">{badge}</div>}
        </div>
        {subtitle && <p className="mg-page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="mg-page-header__actions">{actions}</div>}
    </div>
  );
};
