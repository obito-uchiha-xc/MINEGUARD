import React from 'react';
import { User, Settings, LogOut, ShieldCheck } from 'lucide-react';
import './UserDropdown.css';

export interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  isOpen,
  onClose,
  userName = 'Safety Officer',
  userRole = 'Control Room 01',
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="mg-dropdown-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mg-user-menu" role="menu" aria-label="User Profile Menu">
        {/* PROFILE HEADER */}
        <div className="mg-user-menu__header">
          <div className="mg-user-menu__avatar">
            <User size={18} />
          </div>
          <div className="mg-user-menu__info">
            <span className="mg-user-menu__name">{userName}</span>
            <span className="mg-user-menu__role">{userRole}</span>
          </div>
        </div>

        <div className="mg-user-menu__divider" />

        {/* ITEMS */}
        <div className="mg-user-menu__items">
          <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Session: Local Demo (Auth 🟡 TBD per D-006)
          </div>

          <button
            type="button"
            className="mg-user-menu__item"
            role="menuitem"
            onClick={onClose}
          >
            <ShieldCheck size={16} className="mg-user-menu__item-icon" />
            <span>Operator Credentials</span>
          </button>

          <button
            type="button"
            className="mg-user-menu__item"
            role="menuitem"
            onClick={onClose}
          >
            <Settings size={16} className="mg-user-menu__item-icon" />
            <span>Preferences</span>
          </button>
        </div>

        <div className="mg-user-menu__divider" />

        {/* FOOTER / SIGN OUT */}
        <div className="mg-user-menu__items">
          <button
            type="button"
            className="mg-user-menu__item mg-user-menu__item--danger"
            role="menuitem"
            onClick={onClose}
            title="Authentication backend unconfigured"
          >
            <LogOut size={16} className="mg-user-menu__item-icon" />
            <span>Lock Session</span>
          </button>
        </div>
      </div>
    </>
  );
};
