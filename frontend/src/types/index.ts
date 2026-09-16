export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface Satellite {
  id: string;
  name: string;
  altitude_km: number;
  inclination_deg: number;
  period_min: number;
  phase_deg: number;
  raan_deg: number;
  source: string;
  created_at: string;
}

export interface DebrisObject {
  id: string;
  name: string;
  altitude_km: number;
  inclination_deg: number;
  period_min: number;
  phase_deg: number;
  raan_deg: number;
  source: string;
  rcs_size?: 'SMALL' | 'MEDIUM' | 'LARGE' | string;
  created_at: string;
}

export interface TrajectorySamplePoint {
  time_seconds: number;
  time_utc_rel: string;
  distance_km: number;
  sat_pos: [number, number, number];
  deb_pos: [number, number, number];
}

export interface Encounter {
  id: string;
  rank: number;
  satellite_id: string;
  satellite_name: string;
  debris_id: string;
  debris_name: string;
  min_distance_km: number;
  tca_seconds: number;
  tca_utc: string;
  relative_velocity_kms: number;
  risk_level: RiskLevel;
  model: string;
  trajectory_sample?: TrajectorySamplePoint[];
}

export interface AnalysisResult {
  analysis_id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  satellite: Satellite;
  objects_analyzed: number;
  potential_encounters: number;
  closest_approach_km?: number | null;
  high_risk_count: number;
  duration_hours: number;
  timestep_seconds: number;
  encounters: Encounter[];
  model_label: string;
  disclaimer: string;
  unmodeled_effects: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
  computedFacts?: string[];
  operationalInterpretation?: string;
}

export interface CSVValidationError {
  row: number;
  column?: string;
  message: string;
}

export interface CSVImportResult {
  success: boolean;
  imported_count: number;
  errors: CSVValidationError[];
  items: DebrisObject[];
}
