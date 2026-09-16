import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PanelLeft,
  PanelLeftClose,
  Bell,
  Clock,
  Calendar,
  User,
  Volume2,
  VolumeX,
  Radio,
  Maximize2,
  Minimize2,
  Home,
  RotateCcw,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { NotificationDropdown } from '../feedback/NotificationDropdown';
import { UserDropdown } from '../feedback/UserDropdown';
import { industrialAudio, useHazardAlarm } from '../../utils/sirenAudio';
import { alertsService } from '../../services/alertsService';
import './TopBar.css';

export interface TopBarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
}) => {
  const alarmState = useHazardAlarm();
  const { isSounding: isHazardSounding, isSilenced: isHazardSilenced, activeHazard } = alarmState;

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isUserOpen, setIsUserOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Query real active alerts count on mount
  useEffect(() => {
    let active = true;
    alertsService
      .getActiveAlerts()
      .then((alerts) => {
        if (active) setUnreadCount(alerts.length);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

  // Periodic control-room timestamp clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleMute = () => {
    const newMuted = industrialAudio.toggleMute();
    setIsMuted(newMuted);
  };

  const [isSosBuzzing, setIsSosBuzzing] = useState<boolean>(false);

  // Ensure buzzer stops if component unmounts
  useEffect(() => {
    return () => {
      industrialAudio.stopSosBuzzer();
    };
  }, []);

  const handleStartSos = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSosBuzzing(true);
    industrialAudio.startSosBuzzer();
  };

  const handleStopSos = () => {
    setIsSosBuzzing(false);
    industrialAudio.stopSosBuzzer();
  };

  return (
    <header className="mg-topbar">
      {/* LEFT: SIDEBAR TOGGLE & ENVIRONMENT */}
      <div className="mg-topbar__left">
        {/* Desktop Toggle */}
        <div className="mg-topbar__desktop-toggle">
          <IconButton
            icon={isSidebarCollapsed ? <PanelLeft size={19} /> : <PanelLeftClose size={19} />}
            aria-label={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
            onClick={onToggleSidebar}
            variant="ghost"
          />
        </div>

        {/* Mobile Toggle */}
        <div className="mg-topbar__mobile-toggle">
          <IconButton
            icon={<PanelLeft size={20} />}
            aria-label="Open navigation menu"
            onClick={onOpenMobileMenu}
            variant="ghost"
          />
        </div>

        {/* Unified Cockpit Context & Breadcrumb */}
        <div className="mg-topbar__context-group">
          <span className="mg-topbar__context-dot" />
          <span className="mg-topbar__context-title">CONTROL CENTER</span>
          <span className="mg-topbar__context-sep">/</span>
          <Link to="/" className="mg-topbar__overview-link" title="Return to Mine Overview Landing Page">
            <Home size={12} />
            <span>Overview</span>
          </Link>
        </div>

        {/* Mobile / Compact Quick-Shut Alarm Pill when Hazard Sounding */}
        {isHazardSounding && (
          <button
            type="button"
            className="mg-topbar__mobile-shut-btn"
            onClick={() => industrialAudio.silenceHazardAlarm()}
            title="Silence Hazard SOS Alarm"
          >
            <VolumeX size={13} />
            <span>SHUT ALARM</span>
          </button>
        )}
      </div>

      {/* RIGHT: SIREN CONTROLS, CLOCK, NOTIFICATIONS, USER */}
      <div className="mg-topbar__right">
        {/* Siren Sound Generator Controls */}
        <div className="mg-topbar__sound-controls">
          {isHazardSounding ? (
            <button
              type="button"
              className="mg-topbar__audio-btn mg-topbar__shut-alarm-btn"
              onClick={() => industrialAudio.silenceHazardAlarm()}
              title="Hazard SOS alarm is sounding! Click to immediately shut off alarm sound"
              aria-label="Shut Alarm Sound"
            >
              <VolumeX size={15} />
              <span className="font-bold">SHUT ALARM SOUND</span>
            </button>
          ) : isHazardSilenced && activeHazard ? (
            <button
              type="button"
              className="mg-topbar__audio-btn mg-topbar__rearm-alarm-btn"
              onClick={() => industrialAudio.rearmHazardAlarm()}
              title="Hazard alarm silenced. Click to re-arm siren"
              aria-label="Re-Arm Siren"
            >
              <RotateCcw size={13} />
              <span>Re-Arm Siren</span>
            </button>
          ) : (
            <button
              type="button"
              className={`mg-topbar__audio-btn mg-topbar__sos-btn ${isSosBuzzing ? 'is-buzzing' : ''}`}
              onMouseDown={handleStartSos}
              onMouseUp={handleStopSos}
              onMouseLeave={handleStopSos}
              onTouchStart={handleStartSos}
              onTouchEnd={handleStopSos}
              title="Press and hold to sound audible SOS emergency buzzer (... --- ...)"
              aria-label="Audible SOS Emergency Buzzer"
            >
              <Radio size={14} className={isSosBuzzing ? 'animate-ping text-red-400' : 'text-amber-400'} />
              <span className="font-bold">{isSosBuzzing ? 'SOS TRANSMITTING' : 'SOS Call (Hold)'}</span>
            </button>
          )}

          <button
            type="button"
            className={`mg-topbar__audio-btn ${isMuted ? 'is-muted' : ''}`}
            onClick={handleToggleMute}
            title={isMuted ? 'Audible Alarms Muted (Click to Unmute)' : 'Audible Alarms Active'}
            aria-label="Toggle Siren Mute"
          >
            {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} className="text-emerald-400" />}
          </button>

          {/* Fullscreen Wallboard Mode */}
          <button
            type="button"
            className="mg-topbar__audio-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Kiosk Wallboard' : 'Enter Kiosk Wallboard Mode'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>

        {/* Unified Station Master Status & Clock Capsule */}
        <div className="mg-topbar__telemetry-capsule" title="Station Master Telemetry & Real-Time Mesh Clock">
          <span className="mg-topbar__capsule-dot" />
          <span className="mg-topbar__capsule-status">LIVE</span>
          <span className="mg-topbar__capsule-divider" />
          <Clock size={12} className="mg-topbar__capsule-icon" />
          <span className="mono-telemetry mg-topbar__capsule-time">{timeStr}</span>
          <span className="mg-topbar__capsule-divider" />
          <Calendar size={12} className="mg-topbar__capsule-icon" />
          <span className="mg-topbar__capsule-date">{dateStr}</span>
        </div>

        {/* Notification Button & Popover */}
        <div className="mg-topbar__action-wrap">
          <button
            type="button"
            className="mg-topbar__icon-trigger"
            aria-label="View system notifications"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsUserOpen(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="mg-topbar__notif-badge">
                <Badge variant="critical">
                  {unreadCount}
                </Badge>
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            unreadCount={unreadCount}
            onClearAll={() => setUnreadCount(0)}
            onAlertsUpdated={(count) => setUnreadCount(count)}
          />
        </div>

        {/* User / Profile Area */}
        <div className="mg-topbar__action-wrap">
          <button
            type="button"
            className="mg-topbar__user-trigger"
            aria-label="User profile and preferences"
            onClick={() => {
              setIsUserOpen(!isUserOpen);
              setIsNotifOpen(false);
            }}
          >
            <div className="mg-topbar__user-avatar">
              <User size={15} />
            </div>
            <div className="mg-topbar__user-meta">
              <span className="mg-topbar__user-name">Admin</span>
              <span className="mg-topbar__user-role">Control Room</span>
            </div>
          </button>

          <UserDropdown
            isOpen={isUserOpen}
            onClose={() => setIsUserOpen(false)}
            userName="Mine Administrator"
            userRole="Control Room Safety Officer"
          />
        </div>
      </div>
    </header>
  );
};
