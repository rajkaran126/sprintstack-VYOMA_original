import React, { useState } from 'react';
import { Encounter, Satellite } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { DistanceTimeChart } from './DistanceTimeChart';
import { X, ChevronDown, ChevronUp, Bot, Cpu } from 'lucide-react';

interface EncounterDetailModalProps {
  encounter: Encounter;
  satellite?: Satellite;
  onClose: () => void;
  onAskAi: (question: string) => void;
}

export const EncounterDetailModal: React.FC<EncounterDetailModalProps> = ({
  encounter,
  onClose,
  onAskAi,
}) => {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showLimitations, setShowLimitations] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="analytical-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="text-mono" style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 700 }}>
                {encounter.satellite_id}
              </span>
              <span style={{ color: '#94A3B8' }}>⇄</span>
              <span className="text-mono" style={{ fontSize: '0.8rem', color: '#EA580C', fontWeight: 700 }}>
                {encounter.debris_id}
              </span>
              <RiskBadge level={encounter.risk_level} size="sm" />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
              {encounter.debris_name}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Conjunction against primary asset: {encounter.satellite_name}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '6px',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Analytical Metric Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div className="analytical-panel-subtle" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Closest Approach</div>
            <div className="text-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
              {encounter.min_distance_km} km
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Geometric miss distance</div>
          </div>

          <div className="analytical-panel-subtle" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Time of CA (TCA)</div>
            <div className="text-mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
              {encounter.tca_utc}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>T+{Math.round(encounter.tca_seconds / 60)} min from epoch</div>
          </div>

          <div className="analytical-panel-subtle" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Relative Velocity</div>
            <div className="text-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EA580C', marginTop: '4px' }}>
              {encounter.relative_velocity_kms} km/s
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Hypervelocity encounter</div>
          </div>

          <div className="analytical-panel-subtle" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Risk</div>
            <div style={{ marginTop: '6px' }}>
              <RiskBadge level={encounter.risk_level} size="md" />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>Approximate screening</div>
          </div>
        </div>

        {/* Separation Over Time Chart */}
        <div className="analytical-panel-subtle" style={{ padding: '16px', marginBottom: '20px' }}>
          {encounter.trajectory_sample && (
            <DistanceTimeChart
              samples={encounter.trajectory_sample}
              closestDistanceKm={encounter.min_distance_km}
              tcaUtc={encounter.tca_utc}
            />
          )}
        </div>

        {/* Model Specifications */}
        <div className="analytical-panel-subtle" style={{ padding: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#0F172A' }}>
            <Cpu size={16} color="#EA580C" />
            <span>
              <strong>Astrodynamic Model:</strong> {encounter.model} (Standard μ = 398,600.44 km³/s²)
            </span>
          </div>
        </div>

        {/* Expandable Assumptions */}
        <div
          className="analytical-panel-subtle"
          style={{ marginBottom: '10px', overflow: 'hidden' }}
        >
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: '#0F172A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <span>Model Assumptions</span>
            {showAssumptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAssumptions && (
            <div style={{ padding: '0 16px 14px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
              • Unperturbed circular Keplerian trajectory (r = R_Earth + altitude).<br />
              • Constant mean motion n = sqrt(μ / r³).<br />
              • Fixed orbital inclination and RAAN in Earth-Centered Inertial (ECI) coordinate frame.<br />
              • Deterministic point-to-point Euclidean miss distance without covariance dispersion.
            </div>
          )}
        </div>

        {/* Expandable Limitations */}
        <div
          className="analytical-panel-subtle"
          style={{ marginBottom: '20px', overflow: 'hidden' }}
        >
          <button
            onClick={() => setShowLimitations(!showLimitations)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: '#0F172A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <span>Operational Limitations</span>
            {showLimitations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showLimitations && (
            <div style={{ padding: '0 16px 14px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
              • Does not calculate formal probability of collision (Pc) requiring covariance matrices.<br />
              • Atmospheric drag secular decay not propagated.<br />
              • Earth oblateness J2 orbital plane nodal precession omitted.<br />
              • Intended strictly for approximate geometric triage, not CAM thruster maneuvers.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => {
              onAskAi(`Why was ${encounter.debris_name} (${encounter.debris_id}) flagged as ${encounter.risk_level} risk at distance ${encounter.min_distance_km} km?`);
              onClose();
            }}
            className="liquid-button liquid-button-primary"
            style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Bot size={16} />
            Ask Vyoma AI about this encounter
          </button>

          <button
            onClick={onClose}
            className="liquid-button"
            style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.82rem' }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
