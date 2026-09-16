import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertBanner } from '../components/feedback/AlertBanner';
import {
  UserPlus,
  Shield,
  Search,
  Mail,
  Radio,
  Clock,
} from 'lucide-react';
import './UsersPage.css';

export interface MinePersonnel {
  id: string;
  name: string;
  role: string;
  badgeNumber: string;
  assignedShift: string;
  zoneResponsibility: string;
  status: 'ON_DUTY' | 'STANDBY' | 'OFF_DUTY';
  email: string;
  radioChannel: string;
}

export const UsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState('ALL');

  const personnelList: MinePersonnel[] = [
    {
      id: 'USR-01',
      name: 'Dr. Arjun Verma',
      role: 'Lead Geotechnical Engineer',
      badgeNumber: 'MG-GEO-401',
      assignedShift: 'Shift A (Day)',
      zoneResponsibility: 'Zone B2 & Highwall',
      status: 'ON_DUTY',
      email: 'a.verma@mineguard.internal',
      radioChannel: 'CH-04 (Geotech)',
    },
    {
      id: 'USR-02',
      name: 'Marcus Vance',
      role: 'Underground Shift Supervisor',
      badgeNumber: 'MG-OPS-112',
      assignedShift: 'Shift A (Day)',
      zoneResponsibility: 'Zone A1 (Main Adit)',
      status: 'ON_DUTY',
      email: 'm.vance@mineguard.internal',
      radioChannel: 'CH-01 (Ops Main)',
    },
    {
      id: 'USR-03',
      name: 'K. S. Ramanathan',
      role: 'Director of Mine Safety (DGMS Liaison)',
      badgeNumber: 'MG-SFT-002',
      assignedShift: 'Day Operations',
      zoneResponsibility: 'Mine-Wide Compliance',
      status: 'ON_DUTY',
      email: 'ks.ramanathan@mineguard.internal',
      radioChannel: 'CH-09 (Emergency)',
    },
    {
      id: 'USR-04',
      name: 'Priya Mukherjee',
      role: 'Hydrogeological Specialist',
      badgeNumber: 'MG-GEO-405',
      assignedShift: 'Shift B (Evening)',
      zoneResponsibility: 'Zone C1 Piezometers',
      status: 'STANDBY',
      email: 'p.mukherjee@mineguard.internal',
      radioChannel: 'CH-04 (Geotech)',
    },
    {
      id: 'USR-05',
      name: 'Tariq Al-Mansoor',
      role: 'LoRa Mesh & IoT Systems Specialist',
      badgeNumber: 'MG-ENG-204',
      assignedShift: 'Shift A (Day)',
      zoneResponsibility: 'Gateways & Sensor Nodes',
      status: 'ON_DUTY',
      email: 't.mansoor@mineguard.internal',
      radioChannel: 'CH-07 (Hardware)',
    },
    {
      id: 'USR-06',
      name: 'Sarah Chen',
      role: 'Control-Room Console Operator',
      badgeNumber: 'MG-OPS-330',
      assignedShift: 'Shift C (Night)',
      zoneResponsibility: 'Central Consoles 1 & 2',
      status: 'OFF_DUTY',
      email: 's.chen@mineguard.internal',
      radioChannel: 'CH-02 (Console)',
    },
  ];

  const filtered = personnelList.filter((p) => {
    if (filterShift !== 'ALL' && !p.assignedShift.toLowerCase().includes(filterShift.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.badgeNumber.toLowerCase().includes(q) ||
        p.zoneResponsibility.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Authorized Personnel & Duty Roster"
        subtitle="Operational role-based assignments, communication channels, and active shift safety responders."
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UserPlus size={14} />}
            disabled
            title="User management API unconfigured (🟡 TBD per ADR D-006)"
          >
            Register Personnel (TBD)
          </Button>
        }
      />

      {/* BACKEND STATUS NOTICE */}
      <div style={{ marginBottom: '16px' }}>
        <AlertBanner
          severity="info"
          title="User Management & Authentication Status (🟡 TBD)"
          message="Backend user provisioning and authentication endpoints are currently unconfigured per ADR D-006 and BE-REQ-030. The operational shift roster below serves as a demonstration interface."
        />
      </div>

      <div className="mg-users-layout">
        {/* TOOLBAR */}
        <div className="mg-users-toolbar">
          <div className="users-search">
            <Input
              placeholder="Search by name, role, badge (MG-GEO-...), or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          <div className="shift-pills">
            <button
              type="button"
              className={`shift-pill ${filterShift === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setFilterShift('ALL')}
            >
              All Personnel ({personnelList.length})
            </button>
            <button
              type="button"
              className={`shift-pill ${filterShift === 'Day' ? 'is-active' : ''}`}
              onClick={() => setFilterShift('Day')}
            >
              Day Shift
            </button>
            <button
              type="button"
              className={`shift-pill ${filterShift === 'Evening' ? 'is-active' : ''}`}
              onClick={() => setFilterShift('Evening')}
            >
              Evening Shift
            </button>
            <button
              type="button"
              className={`shift-pill ${filterShift === 'Night' ? 'is-active' : ''}`}
              onClick={() => setFilterShift('Night')}
            >
              Night Shift
            </button>
          </div>
        </div>

        {/* PERSONNEL CARDS GRID */}
        <div className="personnel-grid">
          {filtered.map((person) => (
            <Card key={person.id} className="personnel-card">
              <div className="personnel-card-header">
                <div className="person-avatar">
                  {person.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="person-info">
                  <h4 className="person-name">{person.name}</h4>
                  <span className="person-role">{person.role}</span>
                  <span className="person-badge mono-telemetry">{person.badgeNumber}</span>
                </div>
                <div className={`status-pill ${person.status.toLowerCase()}`}>
                  <span className="dot" />
                  <span>{person.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="personnel-details">
                <div className="detail-item">
                  <Clock size={13} className="detail-icon" />
                  <span>{person.assignedShift}</span>
                </div>
                <div className="detail-item">
                  <Shield size={13} className="detail-icon" />
                  <span>Sector: <strong>{person.zoneResponsibility}</strong></span>
                </div>
                <div className="detail-item">
                  <Radio size={13} className="detail-icon" />
                  <span className="mono-telemetry">{person.radioChannel}</span>
                </div>
                <div className="detail-item">
                  <Mail size={13} className="detail-icon" />
                  <span className="mono-telemetry">{person.email}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
