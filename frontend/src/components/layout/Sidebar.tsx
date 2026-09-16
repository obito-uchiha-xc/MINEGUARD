import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Network,
  TrendingUp,
  Bell,
  FileText,
  Brain,
  Settings,
  Users,
  Shield,
  Radio,
  X,
} from 'lucide-react';
import { NavItem } from '../navigation/NavItem';
import { IconButton } from '../ui/IconButton';
import type { NavItemConfig } from '../../types/navigation';
import './Sidebar.css';

export interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  alertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onMobileClose,
  alertCount = 6,
}) => {
  const navItems: NavItemConfig[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={19} />,
    },
    {
      path: '/live-map',
      label: 'Live Map',
      icon: <Map size={19} />,
    },
    {
      path: '/nodes',
      label: 'Nodes',
      icon: <Network size={19} />,
    },
    {
      path: '/data-trends',
      label: 'Data & Trends',
      icon: <TrendingUp size={19} />,
    },
    {
      path: '/alerts',
      label: 'Alerts',
      icon: <Bell size={19} />,
      badgeCount: alertCount,
      badgeVariant: 'critical',
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: <FileText size={19} />,
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: <Brain size={19} />,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings size={19} />,
    },
    {
      path: '/users',
      label: 'Users',
      icon: <Users size={19} />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="mg-sidebar-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`mg-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Main Navigation"
      >
        {/* BRANDING HEADER */}
        <div className="mg-sidebar__header">
          <Link to="/" className="mg-sidebar__brand" title="Return to Overview Landing Page">
            <div className="mg-sidebar__logo-box" title="MineGuard System">
              <Shield size={22} className="mg-sidebar__logo-icon" />
            </div>
            {!isCollapsed && (
              <div className="mg-sidebar__title-block">
                <div className="mg-sidebar__title-row">
                  <span className="mg-sidebar__app-name">MineGuard</span>
                  <span className="mg-sidebar__sys-tag">CORE</span>
                </div>
                <span className="mg-sidebar__app-sub">Subsidence Monitoring System</span>
              </div>
            )}
          </Link>

          {/* Close button on mobile drawer */}
          <div className="mg-sidebar__mobile-close">
            <IconButton
              icon={<X size={18} />}
              aria-label="Close navigation drawer"
              onClick={onMobileClose}
              size="sm"
            />
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <nav className="mg-sidebar__nav">
          <ul className="mg-sidebar__nav-list">
            {navItems.map((item) => (
              <li key={item.path} className="mg-sidebar__nav-item">
                <NavItem
                  item={item}
                  isCollapsed={isCollapsed}
                  onClick={isMobileOpen ? onMobileClose : undefined}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* SIDEBAR FOOTER / TELEMETRY LINK STATUS */}
        <div className="mg-sidebar__footer">
          <div className={`mg-sidebar__link-status ${isCollapsed ? 'is-collapsed' : ''}`}>
            <Radio size={15} className="mg-sidebar__link-icon" />
            {!isCollapsed && (
              <div className="mg-sidebar__link-text">
                <span className="mg-sidebar__link-title">LoRa Network Hub</span>
                <span className="mg-sidebar__link-sub mono-telemetry">CH 868.1 MHz • 14 dBm</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
