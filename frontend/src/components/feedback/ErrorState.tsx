import React from 'react';
import { AlertTriangle, WifiOff, ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import './ErrorState.css';

export type ErrorType =
  | 'sensor_unavailable'
  | 'gateway_disconnected'
  | 'data_unavailable'
  | 'service_unavailable';

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  isTemporary?: boolean;
  onRetry?: () => void;
  actionText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'data_unavailable',
  title,
  message,
  isTemporary = true,
  onRetry,
  actionText = 'Retry Connection',
  className = '',
}) => {
  let defaultTitle = 'Data Unavailable';
  let defaultMessage = 'The requested telemetry stream could not be loaded.';
  let icon = <AlertTriangle size={32} />;

  switch (type) {
    case 'sensor_unavailable':
      defaultTitle = 'Sensor Node Offline';
      defaultMessage =
        'The specified geotechnical probe is not responding to LoRa polling. Check field battery and physical line-of-sight.';
      icon = <WifiOff size={32} />;
      break;
    case 'gateway_disconnected':
      defaultTitle = 'Mother System Gateway Disconnected';
      defaultMessage =
        'Connection to the central mine surface receiver has been interrupted. Uplink retries are in progress.';
      icon = <ServerCrash size={32} />;
      break;
    case 'service_unavailable':
      defaultTitle = 'Cloud Analysis Service Interrupted';
      defaultMessage =
        'The AI risk aggregation service is temporarily unreachable. Local safety fallbacks remain operational.';
      icon = <ServerCrash size={32} />;
      break;
    case 'data_unavailable':
      break;
  }

  return (
    <div className={`mg-error-state ${className}`} role="alert">
      <div className="mg-error-state__icon-wrapper">{icon}</div>
      <h4 className="mg-error-state__title">{title || defaultTitle}</h4>
      <p className="mg-error-state__message">{message || defaultMessage}</p>
      
      <div className="mg-error-state__badge-container">
        <span className={`mg-error-state__nature ${isTemporary ? 'is-temporary' : 'is-persistent'}`}>
          {isTemporary ? 'Temporary Network Condition' : 'Requires Maintenance Inspection'}
        </span>
      </div>

      {onRetry && (
        <div className="mg-error-state__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw size={14} />}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
