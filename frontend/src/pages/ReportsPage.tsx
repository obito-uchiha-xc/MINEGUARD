import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Download,
  Calendar,
  CheckCircle2,
  User,
  Search,
  Plus,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { AlertBanner } from '../components/feedback/AlertBanner';
import './ReportsPage.css';

export interface MineReportItem {
  id: string;
  title: string;
  reportType: 'SHIFT_HANDOVER' | 'HAZARD_DIGEST' | 'STATUTORY_AUDIT' | 'INCIDENT_REVIEW';
  author: string;
  role: string;
  date: string;
  shift: string;
  status: 'APPROVED' | 'PENDING_REVIEW';
  zone: string;
  keyFindings: string;
  riskSummary: string;
}

export const ReportsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<MineReportItem | null>(null);

  const reports: MineReportItem[] = [
    {
      id: 'REP-2026-0909-A',
      title: 'Day Shift Handover: Zone B2 Progressive Crest Movement',
      reportType: 'SHIFT_HANDOVER',
      author: 'Dr. Arjun Verma',
      role: 'Lead Geotechnical Engineer',
      date: 'Sept 09, 2026',
      shift: 'Shift A (06:00 - 14:00)',
      status: 'APPROVED',
      zone: 'Zone B2 (East Bench)',
      keyFindings: 'Laser displacement on Node N04 reached 18.4mm with progressive acceleration (2.84 mm/h). Sympathetic strain noted at N03 (0.42 mm/h). 50m crest buffer maintained.',
      riskSummary: 'High Risk active; night shift instructed to maintain exclusion and restrict haul trucks from Bench 4 haul road.',
    },
    {
      id: 'REP-2026-0908-W',
      title: 'Weekly DGMS Geotechnical Stability & LoRa Mesh Audit',
      reportType: 'STATUTORY_AUDIT',
      author: 'K. S. Ramanathan',
      role: 'Director of Mine Safety',
      date: 'Sept 08, 2026',
      shift: 'All Shifts',
      status: 'APPROVED',
      zone: 'Mine-Wide (Zones A1 - E2)',
      keyFindings: 'All 12 surface and underground LoRa SX1278 nodes inspected. Packet delivery ratio 99.4%. Battery voltages above 3.8V. InSAR ground reconciliation variance < 0.08mm.',
      riskSummary: 'Full statutory compliance with DGMS circular on automated slope stability monitoring standards.',
    },
    {
      id: 'REP-2026-0907-H',
      title: 'Pore Water Pressure & Post-Monsoon Saturation Digest',
      reportType: 'HAZARD_DIGEST',
      author: 'Priya Mukherjee',
      role: 'Hydrogeologist',
      date: 'Sept 07, 2026',
      shift: 'Shift B (14:00 - 22:00)',
      status: 'APPROVED',
      zone: 'Zone C1 & Zone D3',
      keyFindings: 'Piezometric head stabilized following horizontal drain bore discharges. Maximum water table elevation is 4.2m below bench crest level.',
      riskSummary: 'Moderate risk declining to low risk across North cut.',
    },
    {
      id: 'REP-2026-0905-S',
      title: 'Night Shift Handover: Haulage Drift Strata Convergence',
      reportType: 'SHIFT_HANDOVER',
      author: 'Marcus Vance',
      role: 'Underground Shift Supervisor',
      date: 'Sept 05, 2026',
      shift: 'Shift C (22:00 - 06:00)',
      status: 'APPROVED',
      zone: 'Zone A1 (Main Adit)',
      keyFindings: 'Roof convergence extensometer readings steady at 0.12 mm/week. MPU-6500 tilt sensors register 0.04° variation. Haulage track geometry intact.',
      riskSummary: 'Normal operating conditions; zero ground hazards recorded.',
    },
  ];

  const filteredReports = reports.filter((r) => {
    if (filterType !== 'ALL' && r.reportType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownloadReport = (rep: MineReportItem) => {
    const content = `MINEGUARD GEOTECHNICAL SAFETY REPORT\n${rep.id}: ${rep.title}\nDate: ${rep.date} (${rep.shift})\nAuthor: ${rep.author} (${rep.role})\nZone: ${rep.zone}\nStatus: ${rep.status}\n\nKEY FINDINGS:\n${rep.keyFindings}\n\nRISK SUMMARY:\n${rep.riskSummary}\n\nSystem: MINEGUARD Automated Early Warning Platform`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rep.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Geotechnical Reports & Shift Audits"
        subtitle="Shift handovers, DGMS statutory compliance archives, automated hazard digests, and supervisory safety sign-offs."
        actions={
          <div className="mg-reports-header-actions">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print Digest
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              disabled
              title="Automated shift report compilation is unconfigured in backend (🟡 TBD)"
            >
              Compile Shift Report
            </Button>
          </div>
        }
      />

      {/* STATUTORY REPORTING STATUS BANNER */}
      <div style={{ marginBottom: '16px' }}>
        <AlertBanner
          severity="info"
          title="Statutory Reporting Prototype (🟡 TBD)"
          message="Automated statutory shift handover report generation and document compilation APIs are currently unconfigured in the backend prototype. The report archives below are demonstration templates."
        />
      </div>

      <div className="mg-reports-layout">
        {/* STATUTORY BADGE & FILTER BAR */}
        <div className="mg-reports-toolbar">
          <div className="search-box">
            <Input
              placeholder="Search reports by ID (REP-...), Zone, Title, Author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          <div className="reports-filter-pills">
            <button
              type="button"
              className={`filter-pill ${filterType === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All Reports ({reports.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterType === 'SHIFT_HANDOVER' ? 'is-active' : ''}`}
              onClick={() => setFilterType('SHIFT_HANDOVER')}
            >
              Shift Handovers
            </button>
            <button
              type="button"
              className={`filter-pill ${filterType === 'STATUTORY_AUDIT' ? 'is-active' : ''}`}
              onClick={() => setFilterType('STATUTORY_AUDIT')}
            >
              DGMS Audits
            </button>
            <button
              type="button"
              className={`filter-pill ${filterType === 'HAZARD_DIGEST' ? 'is-active' : ''}`}
              onClick={() => setFilterType('HAZARD_DIGEST')}
            >
              Hazard Digests
            </button>
          </div>
        </div>

        {/* REPORTS GRID */}
        <div className="reports-grid">
          {filteredReports.map((rep) => (
            <Card key={rep.id} className="report-card">
              <div className="report-top-row">
                <div className="report-tags">
                  <span className="report-id mono-telemetry">{rep.id}</span>
                  <span className={`report-type-badge ${rep.reportType.toLowerCase()}`}>
                    {rep.reportType.replace('_', ' ')}
                  </span>
                  <span className="report-zone mono-telemetry">{rep.zone}</span>
                </div>
                <div className="report-status-pill">
                  <CheckCircle2 size={13} className="pill-icon" />
                  <span>{rep.status}</span>
                </div>
              </div>

              <h3 className="report-title">{rep.title}</h3>

              <div className="report-meta-row">
                <div className="meta-item">
                  <Calendar size={13} className="meta-icon" />
                  <span className="mono-telemetry">{rep.date} · {rep.shift}</span>
                </div>
                <div className="meta-item">
                  <User size={13} className="meta-icon" />
                  <span>{rep.author} ({rep.role})</span>
                </div>
              </div>

              <div className="report-summary-box">
                <div className="summary-section">
                  <strong>Key Geotechnical Findings:</strong>
                  <p>{rep.keyFindings}</p>
                </div>
                <div className="summary-section">
                  <strong>Operational Safety Advisory:</strong>
                  <p className="risk-text">{rep.riskSummary}</p>
                </div>
              </div>

              <div className="report-footer">
                <div className="compliance-tag">
                  <ShieldCheck size={14} className="compliance-icon" />
                  <span>DGMS Standard Verified</span>
                </div>

                <div className="report-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download size={13} />}
                    onClick={() => handleDownloadReport(rep)}
                  >
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(rep)}
                  >
                    View Document
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* REPORT MODAL PREVIEW */}
        {selectedReport && (
          <div className="report-modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-id mono-telemetry">{selectedReport.id}</span>
                  <h3 className="modal-title">{selectedReport.title}</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-meta-grid">
                  <div><strong>Date:</strong> {selectedReport.date}</div>
                  <div><strong>Shift:</strong> {selectedReport.shift}</div>
                  <div><strong>Author:</strong> {selectedReport.author}</div>
                  <div><strong>Role:</strong> {selectedReport.role}</div>
                  <div><strong>Zone:</strong> {selectedReport.zone}</div>
                  <div><strong>Status:</strong> {selectedReport.status}</div>
                </div>
                <hr className="modal-divider" />
                <div className="modal-content-block">
                  <h4>Key Geotechnical Observations</h4>
                  <p>{selectedReport.keyFindings}</p>
                </div>
                <div className="modal-content-block">
                  <h4>Operational Safety Protocol</h4>
                  <p>{selectedReport.riskSummary}</p>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={() => handleDownloadReport(selectedReport)}
                >
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
