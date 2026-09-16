import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewAnalysisPage } from './pages/NewAnalysisPage';
import { EncountersPage } from './pages/EncountersPage';
import { ObjectsPage } from './pages/ObjectsPage';
import { AppNavbar } from './components/layout/AppNavbar';
import { EarthScene } from './components/3d/EarthScene';
import { OrbitalAiPanel } from './components/ai/OrbitalAiPanel';
import {
  fetchDemoAnalysis,
  fetchHealth,
  fetchSatellites,
  fetchDebrisList,
} from './services/api';
import { FALLBACK_DEMO_ANALYSIS } from './services/demoData';
import { AnalysisResult, Satellite, DebrisObject } from './types';

export function App() {
  // Navigation Environment: 'landing' (Environment A) or 'app' (Environment B)
  const [currentEnv, setCurrentEnv] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data States
  const [analysis, setAnalysis] = useState<AnalysisResult>(FALLBACK_DEMO_ANALYSIS);
  const [satellites, setSatellites] = useState<Satellite[]>([FALLBACK_DEMO_ANALYSIS.satellite]);
  const [debrisList, setDebrisList] = useState<DebrisObject[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // AI Assistant Panel State
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [queuedAiQuestion, setQueuedAiQuestion] = useState<string | null>(null);

  // Initial Data Fetching
  const loadInitialData = async () => {
    try {
      const health = await fetchHealth();
      setBackendOnline(health.status === 'operational');

      const [demoRes, satsRes, debRes] = await Promise.all([
        fetchDemoAnalysis(),
        fetchSatellites(),
        fetchDebrisList(),
      ]);

      setAnalysis(demoRes);
      if (satsRes && satsRes.length > 0) setSatellites(satsRes);
      if (debRes && debRes.length > 0) setDebrisList(debRes);
    } catch (err) {
      console.warn('[ORBITAL] Initial load fallback:', err);
      setBackendOnline(false);
      setAnalysis(FALLBACK_DEMO_ANALYSIS);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleAskAi = (question: string) => {
    setQueuedAiQuestion(question);
    setAiOpen(true);
  };

  // Environment A: Landing Page View
  if (currentEnv === 'landing') {
    return (
      <LandingPage
        onRunAnalysis={() => {
          setCurrentEnv('app');
          setActiveTab('analysis');
        }}
        onExploreDemo={async () => {
          try {
            const demoRes = await fetchDemoAnalysis();
            setAnalysis(demoRes);
          } catch (e) {
            setAnalysis(FALLBACK_DEMO_ANALYSIS);
          }
          setCurrentEnv('app');
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // Environment B: Analytical Application Shell
  return (
    <div className="app-environment-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Persistent Navigation Bar */}
      <AppNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReturnToLanding={() => setCurrentEnv('landing')}
        onToggleAi={() => setAiOpen(!aiOpen)}
        aiOpen={aiOpen}
        backendOnline={backendOnline}
      />

      {/* Main Workspace Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            analysis={analysis}
            debrisList={debrisList}
            onNavigateNewAnalysis={() => setActiveTab('analysis')}
            onAskAi={handleAskAi}
            onRefreshAnalysis={loadInitialData}
          />
        )}

        {activeTab === 'analysis' && (
          <NewAnalysisPage
            existingSatellites={satellites}
            onAnalysisCompleted={(newResult) => {
              setAnalysis(newResult);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'encounters' && (
          <EncountersPage
            analysis={analysis}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'objects' && (
          <ObjectsPage
            satellites={satellites}
            debrisList={debrisList}
            onRefreshData={loadInitialData}
            onAnalyzeObject={(sat) => {
              setActiveTab('analysis');
            }}
          />
        )}

        {activeTab === 'data' && (
          <ObjectsPage
            satellites={satellites}
            debrisList={debrisList}
            onRefreshData={loadInitialData}
            onAnalyzeObject={(sat) => {
              setActiveTab('analysis');
            }}
          />
        )}

      </main>

      {/* Floating Grounded ORBITAL AI Panel */}
      <OrbitalAiPanel
        analysis={analysis}
        selectedEncounter={analysis.encounters[0] || null}
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        queuedQuestion={queuedAiQuestion}
        onClearQueuedQuestion={() => setQueuedAiQuestion(null)}
      />
    </div>
  );
}

export default App;
