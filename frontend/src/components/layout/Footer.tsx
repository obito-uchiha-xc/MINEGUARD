import React from 'react';
import './Footer.css';

export interface FooterProps {
  lastSyncTime?: string;
}

export const Footer: React.FC<FooterProps> = ({ lastSyncTime }) => {
  return (
    <footer className="mg-footer">
      <div className="mg-footer__left">
        <span>&copy; {new Date().getFullYear()} MineGuard System. All rights reserved.</span>
      </div>
      <div className="mg-footer__right">
        <span className="mg-footer__sync">
          Data via LoRa &bull; Last Sync: {lastSyncTime || '10:24:36 AM'}
        </span>
        <span className="mg-footer__dot" aria-hidden="true" />
      </div>
    </footer>
  );
};
