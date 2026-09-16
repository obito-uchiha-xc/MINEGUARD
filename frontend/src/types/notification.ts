export type NotificationSeverity = 'critical' | 'high_risk' | 'warning' | 'info';

export interface SystemNotification {
  id: string;
  severity: NotificationSeverity;
  target: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
