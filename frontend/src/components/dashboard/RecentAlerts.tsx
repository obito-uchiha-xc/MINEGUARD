import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../feedback/LoadingSkeleton';
import type { DashboardAlert } from '../../data/mock/alerts';
import { RECENT_ALERTS } from '../../data/mock/alerts';
import { API_CONFIG } from '../../api/config';
import './RecentAlerts.css';

export interface RecentAlertsProps {
  alerts?: DashboardAlert[];
  isLoading?: boolean;
  onSelectNode?: (nodeId: string | null) => void;
}

const EMPTY_ALERTS: DashboardAlert[] = [];

export const RecentAlerts: React.FC<RecentAlertsProps> = ({ alerts: propAlerts, isLoading, onSelectNode }) => {
  const navigate = useNavigate();
  const baseAlerts = propAlerts || (API_CONFIG.enableMockFallback ? RECENT_ALERTS : EMPTY_ALERTS);
  const [acknowledgedIds] = useState<Set<string>>(new Set());
  const [isAllAcknowledged, setIsAllAcknowledged] = useState<boolean>(false);

  const alerts = React.useMemo(() => {
    return baseAlerts.map((a) => ({
      ...a,
      isAcknowledged: isAllAcknowledged || a.isAcknowledged || acknowledgedIds.has(a.id),
    }));
  }, [baseAlerts, isAllAcknowledged, acknowledgedIds]);

  const handleAcknowledgeAll = () => {
    setIsAllAcknowledged(true);
  };

  const getAlertIcon = (sev: DashboardAlert['severity']) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle size={15} className="mg-alert-row__icon mg-alert-row__icon--critical" />;
      case 'high_risk':
        return <AlertTriangle size={15} className="mg-alert-row__icon mg-alert-row__icon--high" />;
      case 'warning':
        return <AlertTriangle size={15} className="mg-alert-row__icon mg-alert-row__icon--warning" />;
      default:
        return <Bell size={15} className="mg-alert-row__icon" />;
    }
  };

  return (
    <div className="mg-recent-alerts">
      {/* HEADER */}
      <div className="mg-recent-alerts__header">
        <div className="mg-recent-alerts__title-group">
          <Bell size={17} className="mg-recent-alerts__bell-icon" />
          <h3 className="mg-recent-alerts__title">RECENT ALERTS</h3>
          {!isAllAcknowledged && (
            <Badge variant="critical">
              {alerts.filter((a) => !a.isAcknowledged).length} Active
            </Badge>
          )}
        </div>

        <div className="mg-recent-alerts__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAcknowledgeAll}
            disabled={isAllAcknowledged}
            leftIcon={<CheckCheck size={13} />}
          >
            {isAllAcknowledged ? 'Acknowledged' : 'Acknowledge All'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/alerts')}
            rightIcon={<ArrowRight size={13} />}
          >
            View All
          </Button>
        </div>
      </div>

      {/* ALERTS LIST */}
      <div className="mg-recent-alerts__list">
        {isLoading ? (
          <div style={{ padding: '8px' }}>
            <LoadingSkeleton variant="card" height={60} count={3} />
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <ShieldCheck size={28} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>All Sectors Clear</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.7 }}>Zero active safety alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`mg-alert-row ${alert.isAcknowledged ? 'is-acknowledged' : ''} ${
                alert.nodeId ? 'is-clickable' : ''
              }`}
              onClick={() => alert.nodeId && onSelectNode?.(alert.nodeId)}
              title={alert.nodeId ? `Click to inspect ${alert.nodeId} on map` : undefined}
            >
              <div className="mg-alert-row__lead">
                {getAlertIcon(alert.severity)}
                <span className={`mg-alert-row__sev mg-alert-row__sev--${alert.severity}`}>
                  {alert.severity === 'high_risk' ? 'HIGH' : alert.severity.toUpperCase()}
                </span>
                <span className="mg-alert-row__target">{alert.target}</span>
                <span className="mg-alert-row__time mono-telemetry">{alert.timestamp}</span>
              </div>

              <p className="mg-alert-row__desc">{alert.description}</p>

              {alert.isAcknowledged && (
                <span className="mg-alert-row__ack-badge">
                  <ShieldCheck size={11} /> Acknowledged by Operator
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
