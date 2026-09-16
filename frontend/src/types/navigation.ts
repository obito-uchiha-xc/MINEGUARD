import React from 'react';
import type { BadgeVariant } from './theme';

export interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
  badgeVariant?: BadgeVariant;
}
