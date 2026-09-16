import React from 'react';
import type { AlertSeverity } from '../../types/safety';
import { Info, AlertTriangle, AlertOctagon, AlertCircle, X } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import './AlertBanner.css';

export interface AlertBannerProps {
  severity?: AlertSeverity;
  title: string;
  message?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  severity = 'info',
  title,
  message,
  action,
  onDismiss,
  className = '',
}) => {
  const getIcon = () => {
    switch (severity) {
      case 'info':
        return <Info size={18} className="mg-alert-banner__icon" />;
      case 'warning':
        return <AlertTriangle size={18} className="mg-alert-banner__icon" />;
      case 'high_risk':
        return <AlertOctagon size={18} className="mg-alert-banner__icon" />;
      case 'critical':
        return <AlertCircle size={18} className="mg-alert-banner__icon" />;
    }
  };

  return (
    <div
      className={`mg-alert-banner mg-alert-banner--${severity} ${className}`}
      role="alert"
    >
      <div className="mg-alert-banner__content">
        <span className="mg-alert-banner__icon-wrap">{getIcon()}</span>
        <div className="mg-alert-banner__text">
          <strong className="mg-alert-banner__title">{title}</strong>
          {message && <span className="mg-alert-banner__msg"> — {message}</span>}
        </div>
      </div>
      {(action || onDismiss) && (
        <div className="mg-alert-banner__actions">
          {action}
          {onDismiss && (
            <IconButton
              icon={<X size={15} />}
              aria-label="Dismiss banner notification"
              size="sm"
              variant="ghost"
              onClick={onDismiss}
            />
          )}
        </div>
      )}
    </div>
  );
};
