import React, { useState } from 'react';
import { TrajectorySamplePoint } from '../../types';

interface DistanceTimeChartProps {
  samples: TrajectorySamplePoint[];
  closestDistanceKm: number;
  tcaUtc: string;
}

export const DistanceTimeChart: React.FC<DistanceTimeChartProps> = ({
  samples,
  closestDistanceKm,
  tcaUtc,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrajectorySamplePoint | null>(null);

  if (!samples || samples.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
        Trajectory sample profile unavailable for this object.
      </div>
    );
  }

  // Calculate SVG bounds
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const distances = samples.map((s) => s.distance_km);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances, minDistance + 10);

  const xScale = (index: number) =>
    padding.left + (index / (samples.length - 1)) * (width - padding.left - padding.right);

  const yScale = (dist: number) =>
    height - padding.bottom - ((dist - minDistance) / (maxDistance - minDistance || 1)) * (height - padding.top - padding.bottom);

  // Build SVG Path
  const pathD = samples.reduce((acc, pt, i) => {
    const x = xScale(i);
    const y = yScale(pt.distance_km);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  // Area under curve gradient path
  const areaD = `${pathD} L ${xScale(samples.length - 1)},${height - padding.bottom} L ${xScale(0)},${height - padding.bottom} Z`;

  // Find TCA point index
  const tcaIndex = distances.indexOf(minDistance);
  const tcaX = xScale(tcaIndex);
  const tcaY = yScale(minDistance);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
          Separation Distance Profile (Δr vs Time)
        </div>
        <div style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>
          Minimum Distance: <strong>{closestDistanceKm} km</strong> (at {tcaUtc})
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EA580C" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradientLight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + pct * (height - padding.top - padding.bottom);
          const val = Math.round(maxDistance - pct * (maxDistance - minDistance));
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#64748B"
                fontSize="10"
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontWeight="500"
              >
                {val} km
              </text>
            </g>
          );
        })}

        {/* Time X-axis labels */}
        {samples.map((s, idx) => {
          if (idx % 10 === 0 || idx === tcaIndex) {
            return (
              <text
                key={idx}
                x={xScale(idx)}
                y={height - padding.bottom + 18}
                fill={idx === tcaIndex ? '#DC2626' : '#64748B'}
                fontSize="10"
                textAnchor="middle"
                fontWeight={idx === tcaIndex ? 700 : 500}
                fontFamily="var(--font-mono)"
              >
                {s.time_utc_rel}
              </text>
            );
          }
          return null;
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradientLight)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="url(#lineGradientLight)" strokeWidth="2.5" />

        {/* Closest approach indicator */}
        <circle cx={tcaX} cy={tcaY} r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
        <line
          x1={tcaX}
          y1={tcaY}
          x2={tcaX}
          y2={height - padding.bottom}
          stroke="#DC2626"
          strokeDasharray="2 2"
          strokeWidth="1.5"
        />

        {/* Interactive hover overlay points */}
        {samples.map((s, idx) => (
          <circle
            key={idx}
            cx={xScale(idx)}
            cy={yScale(s.distance_km)}
            r="8"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPoint(s)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Hovered Tooltip */}
        {hoveredPoint && (
          <g>
            <circle
              cx={xScale(samples.indexOf(hoveredPoint))}
              cy={yScale(hoveredPoint.distance_km)}
              r="4"
              fill="#EA580C"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0F172A',
            border: '1px solid #EA580C',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            color: '#FFFFFF',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
          }}
        >
          Time: {hoveredPoint.time_utc_rel} | Distance:{' '}
          <strong style={{ color: '#FDBA74' }}>{hoveredPoint.distance_km} km</strong>
        </div>
      )}
    </div>
  );
};
