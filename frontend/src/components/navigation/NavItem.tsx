import React from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import type { NavItemConfig } from '../../types/navigation';
import './NavItem.css';

export interface NavItemProps {
  item: NavItemConfig;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  item,
  isCollapsed = false,
  onClick,
}) => {
  const content = (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `mg-nav-item ${isActive ? 'is-active' : ''} ${isCollapsed ? 'is-collapsed' : ''}`
      }
      aria-label={item.label}
    >
      <span className="mg-nav-item__icon" aria-hidden="true">
        {item.icon}
      </span>

      {!isCollapsed && (
        <span className="mg-nav-item__label">{item.label}</span>
      )}

      {item.badgeCount !== undefined && item.badgeCount > 0 && (
        <span className="mg-nav-item__badge-wrap">
          {isCollapsed ? (
            <span className="mg-nav-item__badge-dot" aria-label={`${item.badgeCount} unread`} />
          ) : (
            <Badge variant={item.badgeVariant || 'critical'}>
              {item.badgeCount}
            </Badge>
          )}
        </span>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={item.label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
};
