import React from 'react';
import './MapLegend.css';

export const MapLegend: React.FC = () => {
  return (
    <div className="mg-map-legend" aria-label="Map Visual Legend">
      {/* NODE STATUS */}
      <div className="mg-map-legend__section">
        <span className="mg-map-legend__title">NODE STATUS</span>
        <div className="mg-map-legend__items">
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__dot mg-map-legend__dot--normal" />
            Normal
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__dot mg-map-legend__dot--warning" />
            Warning
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__dot mg-map-legend__dot--high" />
            High Risk
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__dot mg-map-legend__dot--critical" />
            Critical
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__dot mg-map-legend__dot--offline" />
            Offline
          </span>
        </div>
      </div>

      <div className="mg-map-legend__divider" />

      {/* RISK ZONES */}
      <div className="mg-map-legend__section">
        <span className="mg-map-legend__title">SPATIAL RISK OVERLAYS</span>
        <div className="mg-map-legend__items">
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__box mg-map-legend__box--low" />
            Low (0-24)
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__box mg-map-legend__box--elevated" />
            Elevated (25-49)
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__box mg-map-legend__box--high" />
            High (50-74)
          </span>
          <span className="mg-map-legend__item">
            <span className="mg-map-legend__box mg-map-legend__box--critical" />
            Critical (75-100)
          </span>
        </div>
      </div>
    </div>
  );
};
