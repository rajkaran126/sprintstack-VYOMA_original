import React, { useState } from 'react';
import { AnalysisResult, Encounter } from '../types';
import { EncounterTable } from '../components/encounters/EncounterTable';
import { EncounterDetailModal } from '../components/encounters/EncounterDetailModal';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { getExportCSVUrl } from '../services/api';
import { Download } from 'lucide-react';

interface EncountersPageProps {
  analysis: AnalysisResult;
  onAskAi: (question: string) => void;
}

export const EncountersPage: React.FC<EncountersPageProps> = ({
  analysis,
  onAskAi,
}) => {
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

  return (
    <div style={{ padding: '24px 20px 60px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <DisclaimerBanner />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A' }}>
            Close Approaches & Conjunction Candidates
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Ranked proximity screening for {analysis.satellite.name} across {analysis.duration_hours}h
          </p>
        </div>

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
          <span>Export Conjunction Table (CSV)</span>
        </a>
      </div>

      <EncounterTable
        encounters={analysis.encounters}
        selectedEncounterId={selectedEncounter?.id}
        onSelectEncounter={(enc) => setSelectedEncounter(enc)}
      />

      {selectedEncounter && (
        <EncounterDetailModal
          encounter={selectedEncounter}
          satellite={analysis.satellite}
          onClose={() => setSelectedEncounter(null)}
          onAskAi={onAskAi}
        />
      )}
    </div>
  );
};
