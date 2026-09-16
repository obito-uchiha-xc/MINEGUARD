import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select, type SelectOption } from '../ui/Select';
import { Button } from '../ui/Button';
import type { AlertFilterState, AlertSeverityLevel, AlertOperationalStatus, AlertCategory } from '../../data/mock/alertsCenter';
import './AlertFilters.css';

export interface AlertFiltersProps {
  filters: AlertFilterState;
  totalMatches: number;
  totalAlerts: number;
  onFilterChange: (updated: Partial<AlertFilterState>) => void;
  onResetFilters: () => void;
  /** Optional list of zone names derived from real backend alert data for the zone filter dropdown */
  availableZones?: string[];
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  filters,
  totalMatches,
  totalAlerts,
  onFilterChange,
  onResetFilters,
  availableZones = [],
}) => {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.severity !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.zone !== 'ALL' ||
    (filters.node && filters.node !== 'ALL') ||
    filters.category !== 'ALL';

  const severityOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Severities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH_RISK', label: 'High Risk' },
    { value: 'WARNING', label: 'Warning' },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Operational Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { value: 'INVESTIGATING', label: 'Investigating' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  const zoneOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Zones' },
    ...availableZones.map((z) => ({ value: z, label: z })),
  ];

  const categoryOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'GROUND_MOVEMENT', label: 'Ground Movement' },
    { value: 'SENSOR_ANOMALY', label: 'Sensor Anomaly' },
    { value: 'NODE_HEALTH', label: 'Node Health' },
    { value: 'COMMUNICATION', label: 'Communication' },
    { value: 'ENVIRONMENTAL', label: 'Environmental' },
  ];

  const sortOptions: SelectOption[] = [
    { value: 'SEVERITY_DESC', label: 'Highest Severity First' },
    { value: 'RISK_SCORE_DESC', label: 'Highest Risk Score' },
    { value: 'TIMESTAMP_DESC', label: 'Most Recent First' },
    { value: 'TIMESTAMP_ASC', label: 'Oldest First' },
  ];

  return (
    <div className="mg-alert-filters">
      {/* SEARCH & CONTROLS ROW */}
      <div className="mg-alert-filters__row">
        {/* Search Input */}
        <div className="mg-alert-filters__search">
          <Input
            placeholder="Search alerts by ID (MG-0042), Node (N04), Zone, Title..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            leftIcon={<Search size={16} />}
          />
        </div>

        {/* Dropdowns */}
        <div className="mg-alert-filters__controls">
          <div className="mg-alert-filters__select">
            <Select
              options={severityOptions}
              value={filters.severity}
              onChange={(e) =>
                onFilterChange({ severity: e.target.value as AlertSeverityLevel | 'ALL' })
              }
              aria-label="Filter by Severity"
            />
          </div>

          <div className="mg-alert-filters__select">
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(e) =>
                onFilterChange({ status: e.target.value as AlertOperationalStatus | 'ALL' })
              }
              aria-label="Filter by Status"
            />
          </div>

          <div className="mg-alert-filters__select">
            <Select
              options={zoneOptions}
              value={filters.zone}
              onChange={(e) => onFilterChange({ zone: e.target.value })}
              aria-label="Filter by Sector Zone"
            />
          </div>

          <div className="mg-alert-filters__select">
            <Select
              options={categoryOptions}
              value={filters.category}
              onChange={(e) =>
                onFilterChange({ category: e.target.value as AlertCategory | 'ALL' })
              }
              aria-label="Filter by Alert Category"
            />
          </div>

          <div className="mg-alert-filters__select">
            <Select
              options={sortOptions}
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as
                    | 'SEVERITY_DESC'
                    | 'RISK_SCORE_DESC'
                    | 'TIMESTAMP_DESC'
                    | 'TIMESTAMP_ASC',
                })
              }
              aria-label="Sort Alerts By"
            />
          </div>

          {isFiltered && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={onResetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* STATUS TABS & MATCH COUNTER */}
      <div className="mg-alert-filters__status-bar">
        <div className="mg-alert-quick-tabs">
          <button
            type="button"
            className={`mg-quick-tab ${filters.status === 'ALL' ? 'is-active' : ''}`}
            onClick={() => onFilterChange({ status: 'ALL' })}
          >
            All Alerts ({totalAlerts})
          </button>
          <button
            type="button"
            className={`mg-quick-tab ${filters.status === 'UNRESOLVED' ? 'is-active' : ''}`}
            onClick={() => onFilterChange({ status: 'UNRESOLVED' })}
          >
            Unresolved
          </button>
          <button
            type="button"
            className={`mg-quick-tab ${filters.status === 'NEW' ? 'is-active' : ''}`}
            onClick={() => onFilterChange({ status: 'NEW' })}
          >
            New
          </button>
          <button
            type="button"
            className={`mg-quick-tab ${filters.status === 'INVESTIGATING' ? 'is-active' : ''}`}
            onClick={() => onFilterChange({ status: 'INVESTIGATING' })}
          >
            Investigating
          </button>
          <button
            type="button"
            className={`mg-quick-tab ${filters.status === 'ACKNOWLEDGED' ? 'is-active' : ''}`}
            onClick={() => onFilterChange({ status: 'ACKNOWLEDGED' })}
          >
            Acknowledged
          </button>
          <button
            type="button"
            className={`mg-quick-tab ${filters.status === 'RESOLVED' ? 'is-active' : ''}`}
            onClick={() => onFilterChange({ status: 'RESOLVED' })}
          >
            Resolved
          </button>
        </div>

        <span className="mg-alert-match-count">
          Displaying <strong>{totalMatches}</strong> of {totalAlerts} safety events
        </span>
      </div>
    </div>
  );
};
