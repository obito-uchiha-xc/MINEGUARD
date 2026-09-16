import React from 'react';
import type { GridColumns } from '../../types/theme';
import './ResponsiveGrid.css';

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: GridColumns;
  gap?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  columns = 3,
  gap = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`mg-grid mg-grid--cols-${columns} mg-grid--gap-${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
