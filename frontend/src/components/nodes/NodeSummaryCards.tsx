import React from 'react';
import { Cpu, Wifi, AlertTriangle, Flame, AlertOctagon, WifiOff } from 'lucide-react';
import type { MapNode } from '../../data/mock/nodes';
import './NodeSummaryCards.css';

export interface NodeSummaryCardsProps {
  nodes: MapNode[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const NodeSummaryCards: React.FC<NodeSummaryCardsProps> = ({
  nodes,
  activeFilter,
  onSelectFilter,
}) => {
  // Dynamically derive all summary metrics from current nodes dataset
  const total = nodes.length;
  const online = nodes.filter((n) => n.isOnline).length;
  const warning = nodes.filter((n) => n.status === 'WARNING').length;
  const highRisk = nodes.filter((n) => n.status === 'HIGH_RISK').length;
  const critical = nodes.filter((n) => n.status === 'CRITICAL').length;
  const offline = nodes.filter((n) => !n.isOnline || n.status === 'OFFLINE').length;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Nodes',
      value: total,
      subtext: 'Probes deployed',
      icon: <Cpu size={18} />,
      colorClass: 'total',
    },
    {
      id: 'ONLINE',
      title: 'Online',
      value: online,
      subtext: 'LoRa uplink active',
      icon: <Wifi size={18} />,
      colorClass: 'online',
    },
    {
      id: 'WARNING',
      title: 'Warning',
      value: warning,
      subtext: 'Minor variance',
      icon: <AlertTriangle size={18} />,
      colorClass: 'warning',
    },
    {
      id: 'HIGH_RISK',
      title: 'High Risk',
      value: highRisk,
      subtext: 'Progressive motion',
      icon: <Flame size={18} />,
      colorClass: 'high-risk',
    },
    {
      id: 'CRITICAL',
      title: 'Critical',
      value: critical,
      subtext: 'Threshold breach',
      icon: <AlertOctagon size={18} />,
      colorClass: 'critical',
    },
    {
      id: 'OFFLINE',
      title: 'Offline',
      value: offline,
      subtext: 'Heartbeat timeout',
      icon: <WifiOff size={18} />,
      colorClass: 'offline',
    },
  ];

  return (
    <div className="mg-node-summary-cards" role="region" aria-label="Node Fleet Summary">
      {cards.map((card) => {
        const isSelected = activeFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            className={`mg-node-summary-card mg-node-summary-card--${card.colorClass} ${
              isSelected ? 'is-selected' : ''
            }`}
            onClick={() => onSelectFilter(isSelected ? 'ALL' : card.id)}
            aria-pressed={isSelected}
            aria-label={`${card.title}: ${card.value} nodes. Click to filter.`}
          >
            <div className="mg-node-summary-card__header">
              <span className="mg-node-summary-card__title">{card.title}</span>
              <span className="mg-node-summary-card__icon">{card.icon}</span>
            </div>
            <div className="mg-node-summary-card__body">
              <span className="mg-node-summary-card__value mono-telemetry">{card.value}</span>
              <span className="mg-node-summary-card__subtext">{card.subtext}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
