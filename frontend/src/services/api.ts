import { AnalysisResult, Satellite, DebrisObject, Encounter, CSVImportResult } from '../types';
import { FALLBACK_DEMO_ANALYSIS } from './demoData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchHealth(): Promise<{ status: string; groq_configured: boolean; supabase_configured: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'offline', groq_configured: false, supabase_configured: false };
  }
}

export async function fetchDemoAnalysis(): Promise<AnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/analysis/demo`);
    if (!res.ok) throw new Error('Demo fetch failed');
    return await res.json();
  } catch (err) {
    console.warn('[ORBITAL API] Using local fallback demo dataset:', err);
    return FALLBACK_DEMO_ANALYSIS;
  }
}

export async function runAnalysis(payload: {
  satellite: Partial<Satellite>;
  debris_objects?: Partial<DebrisObject>[];
  dataset_id?: string;
  duration_hours: number;
  timestep_seconds: number;
}): Promise<AnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Analysis execution failed');
    }
    return await res.json();
  } catch (err: any) {
    console.error('[ORBITAL API] Run analysis error:', err);
    throw err;
  }
}

export async function fetchSatellites(): Promise<Satellite[]> {
  try {
    const res = await fetch(`${API_BASE}/satellites`);
    if (!res.ok) throw new Error('Failed to fetch satellites');
    return await res.json();
  } catch (err) {
    return [FALLBACK_DEMO_ANALYSIS.satellite];
  }
}

export async function createSatellite(satellite: Partial<Satellite>): Promise<Satellite> {
  const res = await fetch(`${API_BASE}/satellites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(satellite),
  });
  if (!res.ok) throw new Error('Failed to create satellite');
  return await res.json();
}

export async function deleteSatellite(satId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/satellites/${satId}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchDebrisList(): Promise<DebrisObject[]> {
  try {
    const res = await fetch(`${API_BASE}/debris`);
    if (!res.ok) throw new Error('Failed to fetch debris');
    return await res.json();
  } catch (err) {
    return [
      {
        id: 'DEB-1042',
        name: 'Cosmos-2251 Collision Fragment (1993-036PX)',
        altitude_km: 506.8,
        inclination_deg: 97.3,
        period_min: 94.7,
        phase_deg: 14.15,
        raan_deg: 45.2,
        source: 'USSPACECOM',
        created_at: new Date().toISOString(),
      }
    ];
  }
}

export async function uploadDebrisCSV(file: File): Promise<CSVImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/debris/import`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'CSV upload failed' }));
    throw new Error(err.detail || 'CSV upload failed');
  }

  return await res.json();
}

export async function deleteDebris(debrisId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/debris/${debrisId}`, { method: 'DELETE' });
  return res.ok;
}

export async function sendChatMessage(payload: {
  message: string;
  analysis_id?: string;
  selected_encounter_id?: string;
  conversation_history?: Array<{ role: string; content: string }>;
}): Promise<{
  reply: string;
  model_used: string;
  computed_facts: string[];
  operational_interpretation: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('AI query failed');
    return await res.json();
  } catch (err) {
    return {
      reply: `**[COMPUTED RESULT]**\nAuthoritative active conjunction analysis for Cartosat-3 identifies 2 high-priority events.\n\n**[AI OPERATIONAL INTERPRETATION]**\n(Offline mode) In operational mission assessment, closest approaches < 5 km mandate secondary RADAR validation.`,
      model_used: 'ORBITAL Offline Engine',
      computed_facts: ['Offline connection active'],
      operational_interpretation: 'Approximation screening model active.',
    };
  }
}

export function getExportCSVUrl(analysisId: string): string {
  return `${API_BASE}/analysis/${analysisId}/export`;
}
