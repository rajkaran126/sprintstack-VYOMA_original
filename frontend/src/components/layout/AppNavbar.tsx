import React from 'react';
import {
  Orbit,
  LayoutDashboard,
  PlaySquare,
  ShieldAlert,
  Database,
  FileSpreadsheet,
  Bot,
  User,
  ArrowLeft,
} from 'lucide-react';

interface AppNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReturnToLanding: () => void;
  onToggleAi: () => void;
  aiOpen: boolean;
  backendOnline?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeTab,
  setActiveTab,
  onReturnToLanding,
  onToggleAi,
  aiOpen,
  backendOnline = true,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analysis', icon: PlaySquare },
    { id: 'encounters', label: 'Encounters', icon: ShieldAlert },
    { id: 'objects', label: 'Objects', icon: Database },
    { id: 'data', label: 'Data', icon: FileSpreadsheet },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 20px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand & Return */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onReturnToLanding}
            title="Return to Landing Page"
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '6px',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #EA580C, #F97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
              }}
            >
              <Orbit size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.06em', color: '#0F172A' }}>
                VYOMA
              </div>
              <div style={{ fontSize: '0.65rem', color: '#EA580C', fontWeight: 600, letterSpacing: '0.04em' }}>
                Department of Space — ISRO
              </div>
            </div>
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: isActive ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: isActive ? '#EA580C' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} color={isActive ? '#EA580C' : '#64748B'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: AI Assistant Toggle, Engine Health, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onToggleAi}
            className={`liquid-button ${aiOpen ? 'liquid-button-primary' : ''}`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: aiOpen ? '1px solid #C2410C' : '1px solid #CBD5E1',
            }}
          >
            <Bot size={15} color={aiOpen ? '#FFFFFF' : '#EA580C'} />
            <span>Lluvia</span>
          </button>

          <div
            title={backendOnline ? 'FastAPI Scientific Engine Online' : 'Local Standalone Mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: '0.72rem',
              color: '#475569',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: backendOnline ? '#16A34A' : '#D97706',
              }}
            />
            <span>{backendOnline ? 'Engine Online' : 'Local Mode'}</span>
          </div>

          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
            }}
            title="Flight Dynamics Officer"
          >
            <User size={15} />
          </div>
        </div>
      </div>
    </header>
  );
};
