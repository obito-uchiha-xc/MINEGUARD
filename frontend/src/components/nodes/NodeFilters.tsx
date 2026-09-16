import React from 'react';
import { Search, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import './NodeFilters.css';

export type SortField =
  | 'id'
  | 'aiRiskScore'
  | 'tiltDeg'
  | 'displacementMm'
  | 'vibrationMmS'
  | 'crackWidthMm'
  | 'batteryPct'
  | 'lastUpdated';

export type SortDirection = 'asc' | 'desc';

export interface NodeFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  zoneFilter: string;
  onZoneChange: (zone: string) => void;
  riskFilter: string;
  onRiskChange: (risk: string) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onToggleSortDirection: () => void;
  onResetFilters: () => void;
  zones: string[];
  totalMatches: number;
  totalCount: number;
}

export const NodeFilters: React.FC<NodeFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  zoneFilter,
  onZoneChange,
  riskFilter,
  onRiskChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onToggleSortDirection,
  onResetFilters,
  zones,
  totalMatches,
  totalCount,
}) => {
  const isFiltered =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    zoneFilter !== 'ALL' ||
    riskFilter !== 'ALL';

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'HIGH_RISK', label: 'High Risk' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'OFFLINE', label: 'Offline' },
  ];

  const zoneOptions = [
    { value: 'ALL', label: 'All Zones' },
    ...zones.map((z) => ({ value: z, label: z })),
  ];

  const riskOptions = [
    { value: 'ALL', label: 'All Risk Levels' },
    { value: 'NORMAL', label: 'Normal (0–29)' },
    { value: 'ELEVATED', label: 'Elevated (30–59)' },
    { value: 'HIGH_RISK', label: 'High Risk (60–79)' },
    { value: 'CRITICAL', label: 'Critical (80–100)' },
  ];

  const sortOptions = [
    { value: 'id', label: 'Sort by Node ID' },
    { value: 'aiRiskScore', label: 'Sort by Risk Score' },
    { value: 'tiltDeg', label: 'Sort by Tilt Angle' },
    { value: 'displacementMm', label: 'Sort by Displacement' },
    { value: 'vibrationMmS', label: 'Sort by Vibration' },
    { value: 'crackWidthMm', label: 'Sort by Crack Width' },
    { value: 'batteryPct', label: 'Sort by Battery' },
    { value: 'lastUpdated', label: 'Sort by Last Update' },
  ];

  return (
    <div className="mg-node-filters">
      <div className="mg-node-filters__row">
        {/* Search */}
        <div className="mg-node-filters__search">
          <Input
            placeholder="Search by Node ID (e.g. N04) or Zone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>

        {/* Dropdowns */}
        <div className="mg-node-filters__controls">
          <div className="mg-node-filters__select">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by Status"
            />
          </div>

          <div className="mg-node-filters__select">
            <Select
              options={zoneOptions}
              value={zoneFilter}
              onChange={(e) => onZoneChange(e.target.value)}
              aria-label="Filter by Zone"
            />
          </div>

          <div className="mg-node-filters__select">
            <Select
              options={riskOptions}
              value={riskFilter}
              onChange={(e) => onRiskChange(e.target.value)}
              aria-label="Filter by Risk Category"
            />
          </div>

          <div className="mg-node-filters__sort-group">
            <div className="mg-node-filters__select mg-node-filters__select--sort">
              <Select
                options={sortOptions}
                value={sortField}
                onChange={(e) => onSortFieldChange(e.target.value as SortField)}
                aria-label="Sort By"
              />
            </div>

            <button
              type="button"
              className="mg-node-filters__sort-btn"
              onClick={onToggleSortDirection}
              title={`Sorting ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
              aria-label={`Toggle sort direction. Currently ${sortDirection}`}
            >
              {sortDirection === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
            </button>
          </div>

          {isFiltered && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={onResetFilters}
              className="mg-node-filters__reset-btn"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="mg-node-filters__status-bar">
        <span className="mg-node-filters__count">
          Showing <strong>{totalMatches}</strong> of {totalCount} deployed sensor nodes
        </span>
        {isFiltered && (
          <span className="mg-node-filters__active-tag">
            Active filters applied
          </span>
        )}
      </div>
    </div>
  );
};
