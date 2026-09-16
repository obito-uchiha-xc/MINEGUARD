import React, { useState } from 'react';
import { Compass, RotateCw } from 'lucide-react';
import './Inclinometer3D.css';

export interface Inclinometer3DProps {
  tiltDeg: number;
  nodeId: string;
  isOnline: boolean;
}

export const Inclinometer3D: React.FC<Inclinometer3DProps> = ({ tiltDeg, nodeId, isOnline }) => {
  // Derive simulated pitch and roll from the node's tiltDeg and nodeId
  const pitch = isOnline ? (nodeId === 'N04' ? 2.84 : tiltDeg * 0.7) : 0;
  const roll = isOnline ? (nodeId === 'N04' ? 1.62 : tiltDeg * 0.5) : 0;

  const [manualRotate, setManualRotate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - manualRotate.y, y: e.clientY - manualRotate.x });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setManualRotate({
      x: Math.max(-60, Math.min(60, e.clientY - startPos.y)),
      y: Math.max(-60, Math.min(60, e.clientX - startPos.x)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetRotation = () => setManualRotate({ x: 0, y: 0 });

  const currentPitch = (pitch + manualRotate.x * 0.5).toFixed(2);
  const currentRoll = (roll + manualRotate.y * 0.5).toFixed(2);

  return (
    <div className="mg-inclinometer-3d">
      <div className="mg-inclinometer-3d__header">
        <div className="mg-inclinometer-3d__title-row">
          <Compass size={16} className="text-gold-glow" />
          <h4 className="mg-inclinometer-3d__title">3D Inclinometer Orientation (MPU-6500)</h4>
        </div>
        <button
          type="button"
          onClick={resetRotation}
          className="mg-inclinometer-3d__reset"
          title="Reset 3D perspective"
        >
          <RotateCw size={13} />
          <span>Reset Angle</span>
        </button>
      </div>

      <div
        className="mg-inclinometer-3d__viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 3D Hardware Node Model */}
        <div className="mg-inclinometer-3d__scene">
          <div
            className="mg-inclinometer-cube"
            style={{
              transform: `rotateX(${-pitch - manualRotate.x * 0.5}deg) rotateY(${manualRotate.y * 0.5}deg) rotateZ(${roll}deg)`,
            }}
          >
            <div className="mg-cube-face mg-cube-face--top">
              <span>{nodeId} NODE</span>
            </div>
            <div className="mg-cube-face mg-cube-face--front">
              <span>Z-AXIS</span>
            </div>
            <div className="mg-cube-face mg-cube-face--back">
              <span>LASER</span>
            </div>
            <div className="mg-cube-face mg-cube-face--left">
              <span>Y-AXIS</span>
            </div>
            <div className="mg-cube-face mg-cube-face--right">
              <span>X-AXIS</span>
            </div>
            <div className="mg-cube-face mg-cube-face--bottom" />
          </div>
        </div>

        {/* Pitch / Roll Overlay Badge */}
        <div className="mg-inclinometer-3d__overlay">
          <div className="mg-axis-chip">
            <span className="axis">PITCH (X):</span>
            <span className="val mono-telemetry">{currentPitch}°</span>
          </div>
          <div className="mg-axis-chip">
            <span className="axis">ROLL (Y):</span>
            <span className="val mono-telemetry">{currentRoll}°</span>
          </div>
          <div className="mg-axis-chip mg-axis-chip--total">
            <span className="axis">VECTOR TILT:</span>
            <span className="val mono-telemetry font-bold text-amber-400">
              {tiltDeg.toFixed(2)}°
            </span>
          </div>
        </div>
      </div>
      <span className="mg-inclinometer-3d__hint">
        Interactive 3D viewport: Drag to rotate &amp; inspect physical bench inclination.
      </span>
    </div>
  );
};
