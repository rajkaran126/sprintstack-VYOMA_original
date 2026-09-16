import React, { useState } from 'react';
import { Orbit, ArrowRight, ShieldCheck, Cpu, Eye, Search, User } from 'lucide-react';
import { LimitationsModal } from '../components/common/LimitationsModal';

interface LandingPageProps {
  onRunAnalysis: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onRunAnalysis,
  onExploreDemo,
}) => {
  const [showLimitations, setShowLimitations] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* 1. Cinematic Background Video (Strictly Environment A ONLY) */}
      <video
        className="landing-video-bg"
        autoPlay
        muted
        loop
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
      />

      {/* 2. Single Bottom Blur Overlay */}
      <div className="landing-blur-overlay" />

      {/* 3. Foreground Cinematic Glassmorphic Content */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Glassmorphic Navbar */}
        <header
          className="animate-blur-fade-up delay-1"
          style={{
            margin: '20px auto 0',
            maxWidth: '1280px',
            width: 'calc(100% - 40px)',
            height: '64px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #EA580C, #F97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 0 16px rgba(234, 88, 12, 0.5)',
              }}
            >
              <Orbit size={20} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.08em', color: '#FFFFFF' }}>
                VYOMA
              </span>
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(234, 88, 12, 0.25)',
                  backdropFilter: 'blur(8px)',
                  color: '#FED7AA',
                  border: '1px solid rgba(234, 88, 12, 0.4)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                ISRO SSA
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              fontSize: '0.85rem',
              color: '#F1F5F9',
              fontWeight: 500,
            }}
          >
            <a
              href="#platform"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FB923C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            >
              Platform
            </a>
            <a
              href="#how-it-works"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FB923C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            >
              How It Works
            </a>
            <a
              href="#technology"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FB923C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            >
              Technology
            </a>
            <button
              onClick={() => setShowLimitations(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FB923C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#E2E8F0')}
            >
              About & Limitations
            </button>
          </nav>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onClick={onExploreDemo}
            >
              <Search size={14} color="#FB923C" />
              <span>Explore Catalog</span>
            </button>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '60px 20px 70px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {/* Glassmorphic Top Pill Label */}
          <div
            className="animate-blur-fade-up delay-2"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(234, 88, 12, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(251, 146, 60, 0.4)',
              color: '#FED7AA',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(234, 88, 12, 0.2)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FB923C' }} />
            SPACE SITUATIONAL AWARENESS · ISRO
          </div>

          {/* Main Headline */}
          <h1
            className="heading-display animate-blur-fade-up delay-3"
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
              lineHeight: 1.1,
              marginBottom: '20px',
              fontWeight: 800,
              color: '#FFFFFF',
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 0, 0, 0.7)',
            }}
          >
            See the Close Approach <br />
            <span
              style={{
                color: '#FB923C',
                textShadow: '0 0 24px rgba(234, 88, 12, 0.6), 0 4px 20px rgba(0, 0, 0, 0.8)',
              }}
            >
              Before It Happens.
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            className="animate-blur-fade-up delay-4"
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
              color: '#F8FAFC',
              maxWidth: '680px',
              lineHeight: 1.6,
              marginBottom: '36px',
              fontWeight: 500,
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.8)',
            }}
          >
            Rapid, approximate orbital screening for identifying potentially dangerous
            satellite–debris encounters across Low Earth Orbit.
          </p>

          {/* Glassmorphic CTA Buttons */}
          <div
            className="animate-blur-fade-up delay-5"
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            {/* Primary Glass Button */}
            <button
              onClick={onRunAnalysis}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.9), rgba(249, 115, 22, 0.85))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                border: '1px solid rgba(254, 215, 170, 0.5)',
                boxShadow: '0 0 24px rgba(234, 88, 12, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 32px rgba(234, 88, 12, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(234, 88, 12, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)';
              }}
            >
              <span>Run Risk Analysis</span>
              <ArrowRight size={16} />
            </button>

            {/* Secondary Glass Button */}
            <button
              onClick={onExploreDemo}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 8px 24px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Explore Demo
            </button>
          </div>

          {/* Small Glassmorphic Technical Label */}
          <div
            className="animate-blur-fade-up delay-6 text-mono"
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: '#E2E8F0',
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            SIMPLIFIED KEPLERIAN MODEL · APPROXIMATE RESULTS
          </div>
        </main>

        {/* Feature Cards Grid (Strictly Glassmorphic on Landing Page) */}
        <section
          id="platform"
          className="animate-blur-fade-up delay-7"
          style={{
            maxWidth: '1280px',
            margin: '0 auto 40px',
            width: 'calc(100% - 40px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(234, 88, 12, 0.2)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB923C',
                marginBottom: '14px',
              }}
            >
              <Eye size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Interactive 3D Space Scene
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              Realistic textured Earth with dynamic orbital trajectories, satellite positions, and proximity indicators.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(234, 88, 12, 0.2)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB923C',
                marginBottom: '14px',
              }}
            >
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Scientific Keplerian Engine
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              Vectorized propagation in ECI coordinates with pairwise minimum search and sub-second parabolic refinement.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(234, 88, 12, 0.2)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB923C',
                marginBottom: '14px',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              VYOMA AI Assistant
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              Groq-powered orbital intelligence strictly grounded in computed facts with clear distinction from interpretation.
            </p>
          </div>
        </section>
      </div>

      {showLimitations && <LimitationsModal onClose={() => setShowLimitations(false)} />}
    </div>
  );
};
