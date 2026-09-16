import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { SystemNotification } from '../../types/notification';
import { alertsService } from '../../services/alertsService';
import { formatUtcTime } from '../../utils/date';
import './NotificationDropdown.css';

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onClearAll?: () => void;
  onAlertsUpdated?: (count: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  unreadCount,
  onClearAll,
  onAlertsUpdated,
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeAlerts = await alertsService.getActiveAlerts();
      const mapped: SystemNotification[] = activeAlerts.map((a) => {
        const sevLower = (a.severity || '').toLowerCase();
        const severity: SystemNotification['severity'] =
          sevLower === 'critical' ? 'critical' : sevLower === 'high' ? 'high_risk' : 'warning';

        return {
          id: `ALT-${a.id}`,
          severity,
          target: a.node_identifier ? `Node ${a.node_identifier}` : `Alert #${a.id}`,
          message: a.message,
          timestamp: formatUtcTime(a.created_at) || a.created_at.slice(11, 16),
          isRead: false,
        };
      });

      setNotifications(mapped);
      onAlertsUpdated?.(mapped.length);
    } catch {
      // Backend disconnected / unavailable
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [onAlertsUpdated]);

  useEffect(() => {
    if (!isOpen) return;
    void (async () => {
      await loadAlerts();
    })();
  }, [isOpen, loadAlerts]);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onClearAll?.();
  };

  const getSeverityIcon = (sev: SystemNotification['severity']) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle size={15} className="mg-notif-item__icon mg-notif-item__icon--critical" />;
      case 'high_risk':
        return <AlertTriangle size={15} className="mg-notif-item__icon mg-notif-item__icon--high" />;
      case 'warning':
        return <AlertTriangle size={15} className="mg-notif-item__icon mg-notif-item__icon--warning" />;
      case 'info':
        return <Info size={15} className="mg-notif-item__icon mg-notif-item__icon--info" />;
    }
  };

  return (
    <>
      <div className="mg-dropdown-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mg-notif-dropdown" role="dialog" aria-label="System Notifications">
        {/* HEADER */}
        <div className="mg-notif-dropdown__header">
          <div className="mg-notif-dropdown__title-group">
            <Bell size={16} className="mg-notif-dropdown__bell" />
            <h4 className="mg-notif-dropdown__title">Active Safety Alerts</h4>
            {unreadCount > 0 && (
              <Badge variant="critical">
                {unreadCount} Active
              </Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAlerts}
              aria-label="Refresh alerts"
              leftIcon={<RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              leftIcon={<CheckCheck size={13} />}
            >
              Mark Read
            </Button>
          </div>
        </div>

        {/* LIST */}
        <div className="mg-notif-dropdown__list">
          {isLoading && notifications.length === 0 ? (
            <div className="mg-notif-dropdown__empty">
              Checking for active safety alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="mg-notif-dropdown__empty">
              No active safety alerts in fleet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`mg-notif-item ${!notif.isRead ? 'is-unread' : ''}`}
              >
                <div className="mg-notif-item__lead">
                  {getSeverityIcon(notif.severity)}
                  <span className="mg-notif-item__target">{notif.target}</span>
                  <span className="mg-notif-item__time">{notif.timestamp}</span>
                </div>
                <p className="mg-notif-item__msg">{notif.message}</p>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="mg-notif-dropdown__footer">
          <span className="mg-notif-dropdown__status">Backend Alert Engine</span>
          <a href="/alerts" className="mg-notif-dropdown__link" onClick={onClose}>
            View All Alerts →
          </a>
        </div>
      </div>
    </>
  );
};

