import React from 'react';
import { Database, Radio, History, Inbox } from 'lucide-react';
import './EmptyState.css';

export type EmptyStateType = 'no_data' | 'no_nodes' | 'historical_baseline' | 'custom';

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no_data',
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  let defaultTitle = 'No Information Available';
  let defaultDescription = 'There is currently no telemetry or event data to report.';
  let defaultIcon = <Inbox size={32} />;

  switch (type) {
    case 'no_data':
      defaultTitle = 'No Telemetry Data Available';
      defaultDescription = 'No real-time packets have been received from monitored nodes yet.';
      defaultIcon = <Database size={32} />;
      break;
    case 'no_nodes':
      defaultTitle = 'No Sensor Nodes Configured';
      defaultDescription = 'No field units are currently provisioned on the Mother System LoRa gateway.';
      defaultIcon = <Radio size={32} />;
      break;
    case 'historical_baseline':
      defaultTitle = 'Insufficient Historical Data';
      defaultDescription = 'Continue monitoring this sector to build a statistical baseline for trend analysis.';
      defaultIcon = <History size={32} />;
      break;
    case 'custom':
      break;
  }

  return (
    <div className={`mg-empty-state ${className}`}>
      <div className="mg-empty-state__icon-wrapper">
        {icon || defaultIcon}
      </div>
      <h4 className="mg-empty-state__title">{title || defaultTitle}</h4>
      <p className="mg-empty-state__description">{description || defaultDescription}</p>
      {action && <div className="mg-empty-state__action">{action}</div>}
    </div>
  );
};
