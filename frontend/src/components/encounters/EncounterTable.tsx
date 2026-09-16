import React, { useState } from 'react';
import { Encounter, RiskLevel } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { ExternalLink } from 'lucide-react';

interface EncounterTableProps {
  encounters: Encounter[];
  selectedEncounterId?: string | null;
  onSelectEncounter: (encounter: Encounter) => void;
}

export const EncounterTable: React.FC<EncounterTableProps> = ({
  encounters,
  selectedEncounterId,
  onSelectEncounter,
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'distance' | 'risk' | 'tca'>('distance');

  // Filtering
  const filtered = encounters.filter((enc) => {
    if (filterRisk === 'ALL') return true;
    return enc.risk_level === filterRisk;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.min_distance_km - b.min_distance_km;
    } else if (sortBy === 'tca') {
      return a.tca_seconds - b.tca_seconds;
    } else if (sortBy === 'risk') {
      const priority: Record<RiskLevel, number> = {
        CRITICAL: 1,
        HIGH: 2,
        MODERATE: 3,
        LOW: 4,
      };
      return priority[a.risk_level] - priority[b.risk_level];
    }
    return 0;
  });

  return (
    <div className="analytical-panel" style={{ padding: '24px', overflow: 'hidden' }}>
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Close Approaches (Screening Ranked)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Pairwise geometric conjunction candidates evaluated over active propagation window
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => {
            const isActive = filterRisk === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilterRisk(lvl)}
                style={{
                  background: isActive ? '#EA580C' : '#FFFFFF',
                  border: isActive ? '1px solid #C2410C' : '1px solid #CBD5E1',
                  color: isActive ? '#FFFFFF' : '#475569',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 6px rgba(234, 88, 12, 0.2)' : 'none',
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', fontSize: '0.78rem', color: '#64748B' }}>
        <span>Sort by:</span>
        <button
          onClick={() => setSortBy('distance')}
          style={{
            background: 'transparent',
            border: 'none',
            color: sortBy === 'distance' ? '#EA580C' : '#475569',
            cursor: 'pointer',
            fontWeight: sortBy === 'distance' ? 700 : 500,
          }}
        >
          Closest Distance {sortBy === 'distance' ? '(asc)' : ''}
        </button>
        <span>·</span>
        <button
          onClick={() => setSortBy('risk')}
          style={{
            background: 'transparent',
            border: 'none',
            color: sortBy === 'risk' ? '#EA580C' : '#475569',
            cursor: 'pointer',
            fontWeight: sortBy === 'risk' ? 700 : 500,
          }}
        >
          Risk Severity {sortBy === 'risk' ? '(asc)' : ''}
        </button>
        <span>·</span>
        <button
          onClick={() => setSortBy('tca')}
          style={{
            background: 'transparent',
            border: 'none',
            color: sortBy === 'tca' ? '#EA580C' : '#475569',
            cursor: 'pointer',
            fontWeight: sortBy === 'tca' ? 700 : 500,
          }}
        >
          TCA Time {sortBy === 'tca' ? '(asc)' : ''}
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="analytical-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>Rank</th>
              <th>Object ID & Designation</th>
              <th>Miss Distance</th>
              <th>Time of Closest Approach (TCA)</th>
              <th>Rel. Velocity</th>
              <th>Estimated Risk</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((enc) => {
              const isSelected = selectedEncounterId === enc.id || selectedEncounterId === enc.debris_id;
              return (
                <tr
                  key={enc.id}
                  onClick={() => onSelectEncounter(enc)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td className="text-mono" style={{ fontWeight: 700, color: '#64748B' }}>
                    #{enc.rank}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{enc.debris_name}</div>
                    <div className="text-mono" style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {enc.debris_id}
                    </div>
                  </td>
                  <td>
                    <span
                      className="text-mono"
                      style={{
                        fontWeight: 700,
                        color:
                          enc.risk_level === 'CRITICAL'
                            ? '#DC2626'
                            : enc.risk_level === 'HIGH'
                            ? '#EA580C'
                            : enc.risk_level === 'MODERATE'
                            ? '#D97706'
                            : '#16A34A',
                        fontSize: '0.95rem',
                      }}
                    >
                      {enc.min_distance_km.toFixed(2)} km
                    </span>
                  </td>
                  <td className="text-mono" style={{ fontSize: '0.8rem', color: '#334155' }}>
                    {enc.tca_utc}
                  </td>
                  <td className="text-mono" style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {enc.relative_velocity_kms.toFixed(2)} km/s
                  </td>
                  <td>
                    <RiskBadge level={enc.risk_level} size="sm" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="liquid-button"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEncounter(enc);
                      }}
                    >
                      <ExternalLink size={12} color="#EA580C" />
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                  No encounters match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
