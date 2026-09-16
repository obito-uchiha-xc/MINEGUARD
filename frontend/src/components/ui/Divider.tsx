import React from 'react';
import './Divider.css';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className = '',
  ...props
}) => {
  if (orientation === 'vertical') {
    return <div className={`mg-divider mg-divider--vertical ${className}`} role="separator" {...props} />;
  }

  return (
    <div className={`mg-divider mg-divider--horizontal ${label ? 'has-label' : ''} ${className}`} role="separator" {...props}>
      {label && <span className="mg-divider__label">{label}</span>}
    </div>
  );
};
