import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  VolumeX,
  Volume2,
  ExternalLink,
  RotateCcw,
  X,
  Radio,
  RadioTower,
} from 'lucide-react';
import { industrialAudio, useHazardAlarm } from '../../utils/sirenAudio';
import './EmergencyHazardBanner.css';

export const EmergencyHazardBanner: React.FC = () => {
  const navigate = useNavigate();
  const alarmState = useHazardAlarm();
  const [dismissedHazardId, setDismissedHazardId] = useState<string | null>(null);

  const { isSounding, isSilenced, audioBlockedByAutoplay, activeHazard, silencedAt } = alarmState;

  // Global hotkey: ESC silences the alarm sound immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSounding) {
        e.preventDefault();
        industrialAudio.silenceHazardAlarm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSounding]);

  const isDismissed = !isSounding && dismissedHazardId === activeHazard?.nodeId;

  if (!activeHazard || isDismissed) {
    return null;
  }

  const handleShutAlarm = () => {
    industrialAudio.silenceHazardAlarm();
  };

  const handleRearmAlarm = () => {
    industrialAudio.rearmHazardAlarm();
  };

  const handleUnlockAudio = () => {
    industrialAudio.unlockAudioAndSound();
  };

  const handleInspectNode = () => {
    navigate(`/nodes?node=${activeHazard.nodeId}`);
  };

  const isCritical = activeHazard.severity === 'CRITICAL';

  return (
    <aside
      className={`mg-hazard-banner ${isSounding ? 'mg-hazard-banner--sounding' : ''} ${
        isSilenced ? 'mg-hazard-banner--silenced' : ''
      }`}
      role="alert"
      aria-live="assertive"
    >
      {/* Top Hazard Warning Stripe */}
      <div className="mg-hazard-banner__stripe" />

      <div className="mg-hazard-banner__content">
        {/* LEFT: ICON & HAZARD DETAILS */}
        <div className="mg-hazard-banner__details">
          <div className="mg-hazard-banner__icon-wrap">
            {isSounding ? (
              <div className="mg-hazard-banner__beacon">
                <Radio size={22} className="mg-hazard-banner__beacon-icon" />
                <span className="mg-hazard-banner__pulse-ring" />
              </div>
            ) : isSilenced ? (
              <div className="mg-hazard-banner__silence-icon">
                <VolumeX size={20} />
              </div>
            ) : (
              <AlertOctagon size={22} className="mg-hazard-banner__alert-icon" />
            )}
          </div>

          <div className="mg-hazard-banner__text">
            <div className="mg-hazard-banner__header">
              <span
                className={`mg-hazard-banner__badge ${
                  isCritical ? 'mg-hazard-banner__badge--critical' : 'mg-hazard-banner__badge--high'
                }`}
              >
                {activeHazard.tarpLevel}
              </span>
              <span className="mg-hazard-banner__title">
                {isSounding
                  ? 'SOS AUDIBLE SIREN SOUNDING — ACTIVE GEOTECHNICAL HAZARD'
                  : isSilenced
                  ? 'AUDIBLE ALARM SILENCED BY OPERATOR'
                  : 'CRITICAL STRATA HAZARD DETECTED'}
              </span>
              {silencedAt && isSilenced && (
                <span className="mg-hazard-banner__silenced-time">Silenced at {silencedAt}</span>
              )}
            </div>

            <p className="mg-hazard-banner__desc">
              <strong className="mg-hazard-banner__node-tag">
                Node {activeHazard.nodeId} ({activeHazard.nodeName})
              </strong>
              <span className="mg-hazard-banner__zone-tag">in {activeHazard.zone}</span>
              <span className="mg-hazard-banner__dot">&bull;</span>
              <span className="mg-hazard-banner__metrics-tag">{activeHazard.metrics}</span>
            </p>
          </div>
        </div>

        {/* RIGHT: IMMEDIATE ALARM ACTIONS (SHUT SOUND / REARM / UNLOCK) */}
        <div className="mg-hazard-banner__actions">
          {/* Autoplay blocked hint & unlock button */}
          {audioBlockedByAutoplay && !isSilenced && (
            <button
              type="button"
              className="mg-hazard-btn mg-hazard-btn--unlock"
              onClick={handleUnlockAudio}
              title="Click to authorize laptop speaker audio and sound SOS siren"
            >
              <Volume2 size={16} />
              <span>🔊 SOUND LAPTOP ALARM</span>
            </button>
          )}

          {/* PRIMARY OPTION: SHUT ALARM SOUND */}
          {isSounding && (
            <button
              type="button"
              id="shut-alarm-sound-btn"
              className="mg-hazard-btn mg-hazard-btn--shut"
              onClick={handleShutAlarm}
              title="Immediately shut off audible SOS buzzer (Shortcut: Esc)"
              aria-label="Shut Alarm Sound"
            >
              <VolumeX size={18} />
              <span className="mg-hazard-btn__shut-label">SHUT ALARM SOUND</span>
              <span className="mg-hazard-btn__shortcut">Esc</span>
            </button>
          )}

          {/* RE-ARM OPTION WHEN SILENCED */}
          {isSilenced && (
            <button
              type="button"
              className="mg-hazard-btn mg-hazard-btn--rearm"
              onClick={handleRearmAlarm}
              title="Re-arm emergency monitoring; sounds siren if hazard persists"
            >
              <RotateCcw size={15} />
              <span>Re-Arm Siren</span>
            </button>
          )}

          {/* INSPECT NODE BUTTON */}
          <button
            type="button"
            className="mg-hazard-btn mg-hazard-btn--inspect"
            onClick={handleInspectNode}
            title={`Open telemetry analysis drawer for Node ${activeHazard.nodeId}`}
          >
            <RadioTower size={15} />
            <span>Inspect Node {activeHazard.nodeId}</span>
            <ExternalLink size={13} />
          </button>

          {/* DISMISS WHEN SILENCED */}
          {isSilenced && (
            <button
              type="button"
              className="mg-hazard-banner__dismiss"
              onClick={() => setDismissedHazardId(activeHazard.nodeId)}
              title="Hide banner"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
