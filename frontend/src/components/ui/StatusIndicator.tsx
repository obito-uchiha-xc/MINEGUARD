import React from 'react';
import type { SafetyStatus } from '../../types/safety';
import { SAFETY_STATUS_CONFIG } from '../../types/safety';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  WifiOff,
  Radio,
  Clock,
} from 'lucide-react';
import './StatusIndicator.css';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: SafetyStatus;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  customLabel?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showIcon = true,
  showText = true,
  size = 'md',
  customLabel,
  pulse = true,
  className = '',
  ...props
}) => {
  const config = SAFETY_STATUS_CONFIG[status] || SAFETY_STATUS_CONFIG.NORMAL;
  const label = customLabel || config.shortLabel;

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
    switch (status) {
      case 'NORMAL':
        return <CheckCircle2 size={iconSize} className="mg-status__icon" aria-hidden="true" />;
      case 'WARNING':
        return <AlertTriangle size={iconSize} className="mg-status__icon" aria-hidden="true" />;
      case 'HIGH_RISK':
        return <AlertOctagon size={iconSize} className="mg-status__icon" aria-hidden="true" />;
      case 'CRITICAL':
        return <AlertCircle size={iconSize} className="mg-status__icon" aria-hidden="true" />;
      case 'OFFLINE':
        return <WifiOff size={iconSize} className="mg-status__icon" aria-hidden="true" />;
      case 'LIVE':
        return <Radio size={iconSize} className="mg-status__icon" aria-hidden="true" />;
      case 'DELAYED':
        return <Clock size={iconSize} className="mg-status__icon" aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`mg-status mg-status--${status.toLowerCase()} mg-status--${size} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
      {...props}
    >
      <span
        className={`mg-status__dot ${pulse && (status === 'LIVE' || status === 'HIGH_RISK' || status === 'CRITICAL') ? 'mg-status__dot--pulse' : ''}`}
        aria-hidden="true"
      />
      {showIcon && renderIcon()}
      {showText && <span className="mg-status__text">{label}</span>}
    </div>
  );
};
