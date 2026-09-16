import React, { useState, useEffect } from 'react';
import { Shield, Clock } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import './AppHeader.css';

export interface AppHeaderProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  tabs?: Array<{ id: string; label: string; count?: number }>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab = 'foundation',
  onTabChange,
  tabs = [
    { id: 'foundation', label: 'Design Tokens' },
    { id: 'components', label: 'UI Components' },
    { id: 'states', label: 'Safety & Feedback States' },
    { id: 'telemetry_preview', label: 'Telemetry Schema' },
  ],
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
      setTimeLocal(now.toLocaleTimeString([], { hour12: false }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="mg-header">
      <div className="mg-header__inner">
        {/* Brand & Tagline */}
        <div className="mg-header__brand-area">
          <div className="mg-header__logo-wrap">
            <Shield className="mg-header__logo-icon" size={22} />
          </div>
          <div className="mg-header__title-group">
            <div className="mg-header__brand-row">
              <h1 className="mg-header__title">MINEGUARD</h1>
              <span className="mg-header__sub-tag">CONTROL ROOM</span>
            </div>
            <p className="mg-header__tagline">Sense. Predict. Protect.</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        {tabs.length > 0 && (
          <nav className="mg-header__nav" aria-label="System Navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`mg-header__tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => onTabChange?.(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="mg-header__tab-badge">{tab.count}</span>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* System Meta & Clock */}
        <div className="mg-header__status-area">
          <div className="mg-header__system-state">
            <StatusIndicator status="LIVE" size="sm" customLabel="LoRa Gateway Online" />
          </div>

          <div className="mg-header__clock" title="Station Master Clock">
            <Clock size={13} className="mg-header__clock-icon" />
            <span className="mg-header__time-local mono-telemetry">{timeLocal}</span>
            <span className="mg-header__time-utc mono-telemetry">{timeUtc}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
