import React, { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { LimitationsModal } from './LimitationsModal';

export const DisclaimerBanner: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        style={{
          background: '#FFF7ED',
          border: '1px solid #FDBA74',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#9A3412',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#C2410C',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
            }}
          >
            <AlertTriangle size={15} color="#EA580C" />
            APPROXIMATE SCREENING
          </span>
          <span style={{ color: '#FDBA74' }}>|</span>
          <span style={{ color: '#7C2D12', fontWeight: 500 }}>
            Simplified Keplerian propagation. Not intended for operational collision avoidance.
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#EA580C',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'underline',
          }}
        >
          <Info size={14} />
          View Astrodynamic Limitations
        </button>
      </div>

      {showModal && <LimitationsModal onClose={() => setShowModal(false)} />}
    </>
  );
};
