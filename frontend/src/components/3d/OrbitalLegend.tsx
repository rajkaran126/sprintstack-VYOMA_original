import React from 'react';

export const OrbitalLegend: React.FC = () => {
  return (
    <div
      className="liquid-glass"
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '6px 14px',
        fontSize: '0.72rem',
        color: '#E2E8F0',
        zIndex: 10,
        pointerEvents: 'none',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }} />
        <span>Satellite</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316' }} />
        <span>Debris</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '14px', height: '2px', backgroundColor: '#38BDF8', display: 'inline-block' }} />
        <span>Satellite Orbit</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '14px', height: '2px', backgroundColor: 'rgba(249, 115, 22, 0.7)', display: 'inline-block' }} />
        <span>Debris Orbit</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
        <span>Closest Approach (TCA)</span>
      </div>
    </div>
  );
};
