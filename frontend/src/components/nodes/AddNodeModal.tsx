import React from 'react';
import { X, Radio, Info, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import './AddNodeModal.css';

export interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNodes?: unknown[];
  onAddNode?: (newNode: unknown) => void;
}

/**
 * AddNodeModal — Phase 15
 *
 * Node provisioning via HTTP POST is NOT available in the current backend
 * (Phases 0–10). Nodes are registered through the LoRa hardware gateway
 * ingestion pipeline, not through a web-based API endpoint.
 *
 * This modal informs the operator rather than submitting synthetic data.
 */
export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="mg-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="mg-add-node-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-node-title"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="mg-add-node-modal__header">
          <div className="mg-add-node-modal__title-row">
            <Radio size={18} className="text-primary" />
            <h2 id="add-node-title" className="mg-add-node-modal__title">
              Provision Sensor Node
            </h2>
          </div>
          <button
            type="button"
            className="mg-add-node-modal__close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY — honest capability notice */}
        <div className="mg-add-node-modal__body">
          <div
            className="mg-drawer__info-notice"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '20px',
              background: 'var(--color-surface-raised)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Lock size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--color-warning)',
                    marginBottom: '8px',
                  }}
                >
                  Web-based Node Registration Unavailable
                </p>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
                  The current backend (Phases 0–10) does not expose an HTTP endpoint for
                  provisioning new sensor nodes. Node registration occurs exclusively through
                  the LoRa hardware gateway ingestion pipeline when a node transmits its
                  first telemetry packet.
                </p>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--color-border)', margin: '0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                  How to deploy a new node:
                </p>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '13px',
                    lineHeight: '1.8',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <li>Install the ESP32-LoRa module at the required location.</li>
                  <li>Flash the firmware with the assigned <code>node_identifier</code>.</li>
                  <li>Confirm the gateway receives the first heartbeat packet.</li>
                  <li>
                    The node will appear automatically in the Nodes inventory once the
                    backend ingestion service processes the first data packet.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mg-add-node-modal__footer">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
