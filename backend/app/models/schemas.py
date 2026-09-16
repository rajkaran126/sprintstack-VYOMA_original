from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class SatelliteBase(BaseModel):
    name: str = Field(..., description="Name of the satellite, e.g. Cartosat-3")
    altitude_km: float = Field(..., gt=100.0, lt=40000.0, description="Altitude above Earth surface in km")
    inclination_deg: float = Field(..., ge=0.0, le=180.0, description="Orbital inclination in degrees")
    period_min: Optional[float] = Field(None, gt=0.0, description="Orbital period in minutes (auto-computed if None)")
    phase_deg: float = Field(0.0, ge=0.0, lt=360.0, description="Initial true anomaly / phase in degrees")
    raan_deg: float = Field(0.0, ge=0.0, lt=360.0, description="Right Ascension of Ascending Node (RAAN) in degrees")
    source: str = Field("ISRO Telemetry / Ephemeris", description="Data source or catalog provider")

class SatelliteCreate(SatelliteBase):
    id: Optional[str] = None

class SatelliteResponse(SatelliteBase):
    id: str
    period_min: float
    created_at: str

class DebrisBase(BaseModel):
    id: str = Field(..., description="Debris catalog ID, e.g. DEB-001 or 1999-025A")
    name: str = Field(..., description="Debris fragment name / parent designation")
    altitude_km: float = Field(..., gt=100.0, lt=40000.0, description="Altitude in km")
    inclination_deg: float = Field(..., ge=0.0, le=180.0, description="Inclination in degrees")
    period_min: Optional[float] = Field(None, gt=0.0, description="Orbital period in minutes")
    phase_deg: float = Field(0.0, ge=0.0, lt=360.0, description="Initial orbital phase in degrees")
    raan_deg: float = Field(0.0, ge=0.0, lt=360.0, description="RAAN in degrees")
    source: str = Field("Space-Track / ISRO SSA", description="Tracking catalog source")
    rcs_size: Optional[str] = Field("MEDIUM", description="Radar Cross Section size: SMALL, MEDIUM, LARGE")

class DebrisCreate(DebrisBase):
    pass

class DebrisResponse(DebrisBase):
    period_min: float
    created_at: str

class TrajectorySamplePoint(BaseModel):
    time_seconds: float
    time_utc_rel: str
    distance_km: float
    sat_pos: List[float]
    deb_pos: List[float]

class EncounterSummary(BaseModel):
    id: str
    rank: int
    satellite_id: str
    satellite_name: str
    debris_id: str
    debris_name: str
    min_distance_km: float
    tca_seconds: float
    tca_utc: str
    relative_velocity_kms: float
    risk_level: str  # CRITICAL, HIGH, MODERATE, LOW
    model: str = "Simplified Keplerian Propagation"
    trajectory_sample: Optional[List[TrajectorySamplePoint]] = None

class AnalysisRunRequest(BaseModel):
    satellite: SatelliteCreate
    debris_objects: Optional[List[DebrisCreate]] = None
    dataset_id: Optional[str] = "demo_isro_leo"
    duration_hours: float = Field(24.0, ge=0.5, le=168.0, description="Analysis propagation duration in hours")
    timestep_seconds: float = Field(60.0, ge=5.0, le=300.0, description="Numerical propagation timestep in seconds")

class AnalysisStatusStep(BaseModel):
    step: int
    name: str
    status: str  # pending, in_progress, completed

class AnalysisResult(BaseModel):
    analysis_id: str
    status: str  # QUEUED, RUNNING, COMPLETED, FAILED
    satellite: SatelliteResponse
    objects_analyzed: int
    potential_encounters: int
    closest_approach_km: Optional[float] = None
    high_risk_count: int
    duration_hours: float
    timestep_seconds: float
    encounters: List[EncounterSummary]
    model_label: str
    disclaimer: str
    unmodeled_effects: List[str]
    created_at: str

class CSVImportError(BaseModel):
    row: int
    column: Optional[str]
    message: str

class CSVImportResponse(BaseModel):
    success: bool
    imported_count: int
    errors: List[CSVImportError] = []
    items: List[DebrisResponse] = []

class ChatMessageRequest(BaseModel):
    message: str
    analysis_id: Optional[str] = None
    selected_encounter_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

class ChatMessageResponse(BaseModel):
    reply: str
    model_used: str
    computed_facts: List[str]
    operational_interpretation: str
