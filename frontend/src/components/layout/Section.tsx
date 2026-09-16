import React from 'react';
import './Section.css';

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <section className={`mg-section ${className}`} {...props}>
      {hasHeader && (
        <div className="mg-section__header">
          <div className="mg-section__headings">
            {title && <h2 className="mg-section__title">{title}</h2>}
            {subtitle && <p className="mg-section__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="mg-section__action">{action}</div>}
        </div>
      )}
      <div className="mg-section__content">{children}</div>
    </section>
  );
};
