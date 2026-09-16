import React, { useState } from 'react';
import { AnalysisResult, Encounter, DebrisObject } from '../types';
import { EarthScene } from '../components/3d/EarthScene';
import { EncounterTable } from '../components/encounters/EncounterTable';
import { EncounterDetailModal } from '../components/encounters/EncounterDetailModal';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { getExportCSVUrl } from '../services/api';
import {
  Satellite as SatelliteIcon,
  ShieldAlert,
  Target,
  AlertTriangle,
  Download,
  Play,
  Sparkles,
} from 'lucide-react';

interface DashboardPageProps {
  analysis: AnalysisResult;
  debrisList: DebrisObject[];
  onNavigateNewAnalysis: () => void;
  onAskAi: (question: string) => void;
  onRefreshAnalysis?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analysis,
  debrisList,
  onNavigateNewAnalysis,
  onAskAi,
}) => {
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(
    analysis.encounters.length > 0 ? analysis.encounters[0] : null
  );
  const [detailModalEncounter, setDetailModalEncounter] = useState<Encounter | null>(null);

  // Risk Distribution counts
  const criticalCount = analysis.encounters.filter((e) => e.risk_level === 'CRITICAL').length;
  const highCount = analysis.encounters.filter((e) => e.risk_level === 'HIGH').length;
  const moderateCount = analysis.encounters.filter((e) => e.risk_level === 'MODERATE').length;
  const lowCount = analysis.encounters.filter((e) => e.risk_level === 'LOW').length;

  return (
    <div style={{ padding: '24px 20px 60px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner / Disclaimer */}
      <div style={{ marginBottom: '20px' }}>
        <DisclaimerBanner />
      </div>

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#EA580C',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              MISSION OVERVIEW · RUN {analysis.analysis_id}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A' }}>
            {analysis.satellite.name}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#475569' }}>
            Orbital Parameters: Altitude {analysis.satellite.altitude_km} km · Inclination{' '}
            {analysis.satellite.inclination_deg}° · Period {analysis.satellite.period_min} min
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href={getExportCSVUrl(analysis.analysis_id)}
            download
            className="liquid-button"
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              background: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
            }}
          >
            <Download size={14} color="#EA580C" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={onNavigateNewAnalysis}
            className="liquid-button liquid-button-primary"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={14} />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Metric 1 */}
        <div className="analytical-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Objects Analyzed
            </span>
            <SatelliteIcon size={18} color="#EA580C" />
          </div>
          <div className="text-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>
            {analysis.objects_analyzed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Debris objects in active screening
          </div>
        </div>

        {/* Metric 2 */}
        <div className="analytical-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Potential Encounters
            </span>
            <Target size={18} color="#EA580C" />
          </div>
          <div className="text-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>
            {analysis.potential_encounters}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Pairs evaluated over {analysis.duration_hours}h
          </div>
        </div>

        {/* Metric 3 */}
        <div className="analytical-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Closest Approach
            </span>
            <AlertTriangle size={18} color="#DC2626" />
          </div>
          <div className="text-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: '#DC2626', marginTop: '8px' }}>
            {analysis.closest_approach_km ? `${analysis.closest_approach_km} km` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Critical threshold &lt; 5.0 km
          </div>
        </div>

        {/* Metric 4 */}
        <div className="analytical-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              High-Risk Objects
            </span>
            <ShieldAlert size={18} color="#DC2626" />
          </div>
          <div className="text-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: '#B91C1C', marginTop: '8px' }}>
            {analysis.high_risk_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Critical & High screening alerts
          </div>
        </div>
      </div>

      {/* 3D ORBITAL VIEW (Interactive Canvas - Kept Dark Space as Requested) */}
      <div
        className="analytical-panel"
        style={{
          padding: 0,
          overflow: 'hidden',
          marginBottom: '24px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#02040A',
          border: '1px solid #CBD5E1',
        }}
      >
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
              3D ORBITAL VIEW
            </span>
            <span style={{ color: '#64748B' }}>·</span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Earth-Centered Inertial (ECI) Interactive Geometry
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FDBA74' }}>
            Selected Conjunction:{' '}
            <strong style={{ color: '#FFFFFF' }}>{selectedEncounter ? selectedEncounter.debris_name : 'None'}</strong>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <EarthScene
            satellite={analysis.satellite}
            debrisList={debrisList}
            selectedEncounter={selectedEncounter}
            onSelectDebris={(id) => {
              const match = analysis.encounters.find((e) => e.debris_id === id);
              if (match) setSelectedEncounter(match);
            }}
          />
        </div>
      </div>

      {/* Two Column Section: Risk Distribution & Analysis Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Risk Distribution Card */}
        <div className="analytical-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            Risk Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Critical (< 5 km)', count: criticalCount, color: '#DC2626', pct: (criticalCount / analysis.objects_analyzed) * 100 },
              { label: 'High (5 – 15 km)', count: highCount, color: '#EA580C', pct: (highCount / analysis.objects_analyzed) * 100 },
              { label: 'Moderate (15 – 50 km)', count: moderateCount, color: '#D97706', pct: (moderateCount / analysis.objects_analyzed) * 100 },
              { label: 'Low (≥ 50 km)', count: lowCount, color: '#16A34A', pct: (lowCount / analysis.objects_analyzed) * 100 },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                  <span style={{ color: '#334155', fontWeight: 500 }}>{item.label}</span>
                  <span className="text-mono" style={{ fontWeight: 700, color: item.color }}>
                    {item.count} objects ({Math.round(item.pct)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.pct}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Status / Configuration Card */}
        <div className="analytical-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            Analysis Engine Status
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
            <div className="analytical-panel-subtle" style={{ padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Propagation Horizon</div>
              <div className="text-mono" style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontSize: '0.95rem' }}>
                {analysis.duration_hours} Hours
              </div>
            </div>

            <div className="analytical-panel-subtle" style={{ padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Numerical Step</div>
              <div className="text-mono" style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontSize: '0.95rem' }}>
                {analysis.timestep_seconds} Seconds
              </div>
            </div>

            <div className="analytical-panel-subtle" style={{ padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Gravitational Parameter</div>
              <div className="text-mono" style={{ fontWeight: 700, color: '#EA580C', marginTop: '2px', fontSize: '0.95rem' }}>
                398,600.44 km³/s²
              </div>
            </div>

            <div className="analytical-panel-subtle" style={{ padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>Execution Lifecycle</div>
              <div className="text-mono" style={{ fontWeight: 700, color: '#16A34A', marginTop: '2px', fontSize: '0.95rem' }}>
                COMPLETED
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onAskAi('Summarize the top risk encounters from this analysis run.')}
              className="liquid-button"
              style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={14} color="#EA580C" />
              <span>Ask Vyoma AI to Summarize</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highest Priority Encounters Table */}
      <div style={{ marginBottom: '24px' }}>
        <EncounterTable
          encounters={analysis.encounters}
          selectedEncounterId={selectedEncounter?.id}
          onSelectEncounter={(enc) => {
            setSelectedEncounter(enc);
            setDetailModalEncounter(enc);
          }}
        />
      </div>

      {/* Encounter Detail Modal */}
      {detailModalEncounter && (
        <EncounterDetailModal
          encounter={detailModalEncounter}
          satellite={analysis.satellite}
          onClose={() => setDetailModalEncounter(null)}
          onAskAi={onAskAi}
        />
      )}
    </div>
  );
};
