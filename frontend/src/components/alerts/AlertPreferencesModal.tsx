import React, { useState } from 'react';
import {
  X,
  Bell,
  Shield,
  Clock,
  Sliders,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import './AlertPreferencesModal.css';

export interface AlertPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertPreferencesModal: React.FC<AlertPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [controlRoomBanner, setControlRoomBanner] = useState(true);
  const [topBarPulse, setTopBarPulse] = useState(true);
  const [mobilePush, setMobilePush] = useState(true);
  const [smsDispatch, setSmsDispatch] = useState(false);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [escalationTime, setEscalationTime] = useState('15');
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [consensusThreshold, setConsensusThreshold] = useState('2');
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setControlRoomBanner(true);
    setTopBarPulse(true);
    setMobilePush(true);
    setSmsDispatch(false);
    setAutoEscalate(true);
    setEscalationTime('15');
    setRefreshInterval('5');
    setConsensusThreshold('2');
  };

  return (
    <div className="mg-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="mg-alert-prefs-modal"
        role="dialog"
        aria-label="Alert & Notification Preferences"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mg-modal-header">
          <div className="modal-title-group">
            <Sliders size={18} className="modal-icon" />
            <h3 className="modal-title">Operational Early Warning Preferences</h3>
          </div>
          <button
            type="button"
            className="mg-modal-close-btn"
            onClick={onClose}
            aria-label="Close preferences dialog"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSave} className="mg-alert-prefs-form">
          <div className="mg-alert-prefs-body">
            {/* NOTIFICATION CHANNELS */}
            <section className="prefs-section">
              <h4 className="prefs-section__title">
                <Bell size={15} />
                <span>Active Dispatch Channels</span>
              </h4>
              <p className="prefs-section__desc">
                Configure how telemetry anomaly warnings are routed to the central control room and geotechnical crews.
              </p>

              <div className="prefs-toggles-list">
                <label className="pref-toggle-item">
                  <div className="pref-toggle-info">
                    <span className="pref-toggle-label">Central Control-Room Dashboard Banner</span>
                    <span className="pref-toggle-sub">
                      Show high-contrast operational status banner across all active consoles
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={controlRoomBanner}
                    onChange={(e) => setControlRoomBanner(e.target.checked)}
                    className="pref-checkbox"
                  />
                </label>

                <label className="pref-toggle-item">
                  <div className="pref-toggle-info">
                    <span className="pref-toggle-label">TopBar Warning Indicator Pulse</span>
                    <span className="pref-toggle-sub">
                      Visual status pulse on the global header indicator when unacknowledged alerts exist
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={topBarPulse}
                    onChange={(e) => setTopBarPulse(e.target.checked)}
                    className="pref-checkbox"
                  />
                </label>

                <label className="pref-toggle-item">
                  <div className="pref-toggle-info">
                    <span className="pref-toggle-label">Field Team Mobile Mesh Notification</span>
                    <span className="pref-toggle-sub">
                      Forward geotechnical hazard warnings to ruggedized handhelds via LoRa/Mesh
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mobilePush}
                    onChange={(e) => setMobilePush(e.target.checked)}
                    className="pref-checkbox"
                  />
                </label>

                <label className="pref-toggle-item">
                  <div className="pref-toggle-info">
                    <span className="pref-toggle-label">Supervisory SMS & Geotechnical Dispatch</span>
                    <span className="pref-toggle-sub">
                      Transmit automated SMS summary to Geotechnical Lead for Critical alerts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsDispatch}
                    onChange={(e) => setSmsDispatch(e.target.checked)}
                    className="pref-checkbox"
                  />
                </label>
              </div>
            </section>

            {/* AUTOMATED ESCALATION PROTOCOL */}
            <section className="prefs-section">
              <h4 className="prefs-section__title">
                <Clock size={15} />
                <span>Automated Escalation Protocol</span>
              </h4>
              <div className="prefs-toggles-list">
                <label className="pref-toggle-item">
                  <div className="pref-toggle-info">
                    <span className="pref-toggle-label">Auto-Escalate Unacknowledged Alerts</span>
                    <span className="pref-toggle-sub">
                      Automatically elevate severity level if no operator acknowledgment is registered
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEscalate}
                    onChange={(e) => setAutoEscalate(e.target.checked)}
                    className="pref-checkbox"
                  />
                </label>
              </div>

              {autoEscalate && (
                <div className="pref-field-row">
                  <label htmlFor="escalation-time-select" className="pref-field-label">Escalation Delay Threshold:</label>
                  <select
                    id="escalation-time-select"
                    value={escalationTime}
                    onChange={(e) => setEscalationTime(e.target.value)}
                    className="pref-select mono-telemetry"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes (Standard)</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
              )}
            </section>

            {/* CONSENSUS & TELEMETRY SETTINGS */}
            <section className="prefs-section">
              <h4 className="prefs-section__title">
                <Shield size={15} />
                <span>Detection Consensus & Polling Cadence</span>
              </h4>

              <div className="pref-field-row">
                <label htmlFor="consensus-threshold-select" className="pref-field-label">Multi-Sensor Consensus Requirement:</label>
                <select
                  id="consensus-threshold-select"
                  value={consensusThreshold}
                  onChange={(e) => setConsensusThreshold(e.target.value)}
                  className="pref-select mono-telemetry"
                >
                  <option value="1">Single sensor threshold exceedance (Highest sensitivity)</option>
                  <option value="2">2+ correlated sensors deviating (Recommended standard)</option>
                  <option value="3">3+ correlated sensors deviating (Strict confirmation)</option>
                </select>
              </div>

              <div className="pref-field-row">
                <label htmlFor="telemetry-interval-select" className="pref-field-label">Telemetry Ingestion Cadence:</label>
                <select
                  id="telemetry-interval-select"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="pref-select mono-telemetry"
                >
                  <option value="2">High Frequency (2s interval)</option>
                  <option value="5">Operational Standard (5s interval)</option>
                  <option value="15">Bandwidth Conserving (15s interval)</option>
                </select>
              </div>
            </section>
          </div>

          <footer className="mg-modal-footer">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <div className="footer-actions">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={savedFeedback ? <Check size={14} /> : undefined}
              >
                {savedFeedback ? 'Saved!' : 'Save Preferences'}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};
