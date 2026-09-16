import React, { useState } from 'react';
import { runAnalysis, uploadDebrisCSV } from '../services/api';
import { AnalysisResult, DebrisObject, Satellite } from '../types';
import { Play, Upload, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

interface NewAnalysisPageProps {
  onAnalysisCompleted: (result: AnalysisResult) => void;
  existingSatellites: Satellite[];
}

export const NewAnalysisPage: React.FC<NewAnalysisPageProps> = ({
  onAnalysisCompleted,
}) => {
  // Satellite Form State
  const [satelliteName, setSatelliteName] = useState('Cartosat-3 (ISRO High-Res)');
  const [altitudeKm, setAltitudeKm] = useState<number>(505.0);
  const [inclinationDeg, setInclinationDeg] = useState<number>(97.5);
  const [phaseDeg, setPhaseDeg] = useState<number>(14.0);
  const [raanDeg, setRaanDeg] = useState<number>(45.0);

  // Debris Mode: 'demo' | 'upload'
  const [datasetMode, setDatasetMode] = useState<'demo' | 'upload'>('demo');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [customDebrisList, setCustomDebrisList] = useState<DebrisObject[]>([]);

  // Propagation Form State
  const [durationHours, setDurationHours] = useState<number>(24.0);
  const [timestepSeconds, setTimestepSeconds] = useState<number>(60.0);

  // Analysis Lifecycle Animation State
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const steps = [
    'Preparing dataset',
    'Validating orbital parameters',
    'Propagating orbits',
    'Calculating pairwise approaches',
    'Ranking risk',
    'Saving results',
    'Analysis complete',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadStatus('Uploading & validating CSV schema...');

    try {
      const res = await uploadDebrisCSV(file);
      if (res.success && res.items.length > 0) {
        setCustomDebrisList(res.items);
        setUploadStatus(`Successfully parsed ${res.imported_count} debris objects.`);
      } else {
        setUploadStatus(`CSV parsed with ${res.errors.length} errors: ${res.errors[0]?.message || 'Check format'}`);
      }
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  const handleRunAnalysis = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    setActiveStep(0);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    try {
      const payload = {
        satellite: {
          name: satelliteName,
          altitude_km: Number(altitudeKm),
          inclination_deg: Number(inclinationDeg),
          phase_deg: Number(phaseDeg),
          raan_deg: Number(raanDeg),
        },
        debris_objects: datasetMode === 'upload' && customDebrisList.length > 0 ? customDebrisList : undefined,
        dataset_id: datasetMode === 'demo' ? 'demo_isro_leo' : undefined,
        duration_hours: Number(durationHours),
        timestep_seconds: Number(timestepSeconds),
      };

      const result = await runAnalysis(payload);

      clearInterval(stepInterval);
      setActiveStep(steps.length - 1);

      setTimeout(() => {
        setIsExecuting(false);
        onAnalysisCompleted(result);
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsExecuting(false);
      setErrorMsg(err.message || 'Analysis run failed. Please check parameters.');
    }
  };

  return (
    <div style={{ padding: '24px 20px 60px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <DisclaimerBanner />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
          New Orbital Conjunction Analysis
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
          Configure primary satellite parameters, select candidate debris catalog, and execute Keplerian screening
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Form Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Satellite Parameters */}
        <div className="analytical-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            1. Primary Satellite Parameters
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Satellite Name / Asset ID
              </label>
              <input
                type="text"
                value={satelliteName}
                onChange={(e) => setSatelliteName(e.target.value)}
                className="orbital-input"
                placeholder="e.g. Cartosat-3 or RISAT-2BR1"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Altitude (km)
              </label>
              <input
                type="number"
                value={altitudeKm}
                onChange={(e) => setAltitudeKm(parseFloat(e.target.value))}
                className="orbital-input text-mono"
                min={150}
                max={36000}
                step={5}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Inclination (°)
              </label>
              <input
                type="number"
                value={inclinationDeg}
                onChange={(e) => setInclinationDeg(parseFloat(e.target.value))}
                className="orbital-input text-mono"
                min={0}
                max={180}
                step={0.1}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Initial Phase θ₀ (°)
              </label>
              <input
                type="number"
                value={phaseDeg}
                onChange={(e) => setPhaseDeg(parseFloat(e.target.value))}
                className="orbital-input text-mono"
                min={0}
                max={360}
                step={1}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                RAAN Ω (°)
              </label>
              <input
                type="number"
                value={raanDeg}
                onChange={(e) => setRaanDeg(parseFloat(e.target.value))}
                className="orbital-input text-mono"
                min={0}
                max={360}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Debris Dataset */}
        <div className="analytical-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            2. Debris Catalog & Conjunction Target Set
          </h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setDatasetMode('demo')}
              className={`liquid-button ${datasetMode === 'demo' ? 'liquid-button-primary' : ''}`}
              style={{ padding: '8px 18px', borderRadius: '6px', fontSize: '0.82rem' }}
            >
              Use Demo ISRO LEO Catalog (8 Objects)
            </button>

            <button
              type="button"
              onClick={() => setDatasetMode('upload')}
              className={`liquid-button ${datasetMode === 'upload' ? 'liquid-button-primary' : ''}`}
              style={{ padding: '8px 18px', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={14} />
              <span>Upload Custom CSV</span>
            </button>
          </div>

          {datasetMode === 'demo' && (
            <div className="analytical-panel-subtle" style={{ padding: '14px', fontSize: '0.82rem', color: '#475569' }}>
              Includes tracked fragments from Cosmos-2251 collision, Fengyun-1C ASAT event, Iridium-33 derelicts, and
              spent SL-4 rocket booster stages calibrated for Indian Low Earth Orbit assets.
            </div>
          )}

          {datasetMode === 'upload' && (
            <div className="analytical-panel-subtle" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ fontSize: '0.82rem', color: '#334155' }}
                />
                <a
                  href="/sample_debris_catalog.csv"
                  download
                  style={{ fontSize: '0.78rem', color: '#EA580C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FileText size={14} />
                  Download Sample CSV Template
                </a>
              </div>
              {uploadStatus && (
                <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 500, marginTop: '10px' }}>
                  {uploadStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Propagation Settings */}
        <div className="analytical-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            3. Numerical Propagation Settings
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Analysis Duration (Hours)
              </label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                className="orbital-input text-mono"
                min={1}
                max={168}
                step={1}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>e.g. 24 hours (1 Earth day)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Coarse Timestep (Seconds)
              </label>
              <input
                type="number"
                value={timestepSeconds}
                onChange={(e) => setTimestepSeconds(parseFloat(e.target.value))}
                className="orbital-input text-mono"
                min={10}
                max={300}
                step={10}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Sub-second refinement around TCA active</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Stepper (when executing) */}
        {isExecuting && (
          <div className="analytical-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EA580C', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} className="animate-spin" />
              Analysis Engine Lifecycle Status: RUNNING
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((s, idx) => {
                const isCompleted = activeStep > idx;
                const isCurrent = activeStep === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.82rem',
                      color: isCompleted ? '#16A34A' : isCurrent ? '#0F172A' : '#94A3B8',
                      fontWeight: isCurrent || isCompleted ? 600 : 400,
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? '#16A34A' : isCurrent ? '#EA580C' : '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        color: '#FFFFFF',
                        fontWeight: 700,
                      }}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <span>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            onClick={handleRunAnalysis}
            disabled={isExecuting}
            className="liquid-button liquid-button-primary"
            style={{
              padding: '14px 34px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isExecuting ? 0.6 : 1,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
            }}
          >
            <Play size={16} />
            <span>{isExecuting ? 'Propagating Orbits...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
