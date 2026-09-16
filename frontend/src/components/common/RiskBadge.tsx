import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const getStyles = () => {
    switch (level) {
      case 'CRITICAL':
        return 'badge-critical';
      case 'HIGH':
        return 'badge-high';
      case 'MODERATE':
        return 'badge-moderate';
      case 'LOW':
      default:
        return 'badge-low';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3.5 py-1.5 text-sm font-semibold';
      case 'md':
      default:
        return 'px-2.5 py-1 text-xs font-medium';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider text-mono ${getStyles()} ${getSizeClasses()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: 'var(--font-mono)',
        padding: size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 14px' : '4px 10px',
        fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '0.85rem' : '0.75rem',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor:
            level === 'CRITICAL'
              ? '#EF4444'
              : level === 'HIGH'
              ? '#F97316'
              : level === 'MODERATE'
              ? '#EAB308'
              : '#22C55E',
          boxShadow: level === 'CRITICAL' ? '0 0 8px #EF4444' : 'none',
        }}
      />
      {level}
    </span>
  );
};
