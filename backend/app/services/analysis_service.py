"""
ORBITAL Analysis Service
Orchestrates end-to-end orbital screening workflows, manages run states,
and coordinates with Supabase / local persistence.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.core.constants import (
    MODEL_LABEL,
    MODEL_DISCLAIMER,
    UNMODELED_EFFECTS,
    RISK_CRITICAL,
    RISK_HIGH,
)
from app.services.orbital_service import compute_orbital_period_minutes
from app.services.risk_service import analyze_encounters_batch
from app.services.dataset_service import (
    get_demo_satellites,
    get_demo_debris,
    DEMO_SATELLITES,
    DEMO_DEBRIS_OBJECTS,
)
from app.core.config import settings

# In-Memory Store for instant zero-dependency execution
_ANALYSES_STORE: Dict[str, Dict[str, Any]] = {}
_SATELLITES_STORE: Dict[str, Dict[str, Any]] = {s["id"]: dict(s) for s in DEMO_SATELLITES}
_DEBRIS_STORE: Dict[str, Dict[str, Any]] = {d["id"]: dict(d) for d in DEMO_DEBRIS_OBJECTS}

def get_supabase_client():
    """Initializes Supabase client if credentials are provided in settings."""
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            from supabase import create_client
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        except Exception:
            return None
    return None

def execute_analysis_run(
    satellite_data: Dict[str, Any],
    debris_list: List[Dict[str, Any]],
    duration_hours: float = 24.0,
    timestep_seconds: float = 60.0,
    analysis_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the real orbital propagation and screening pipeline.
    """
    if not analysis_id:
        analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"

    # Auto-calculate orbital period if missing
    if not satellite_data.get("period_min"):
        satellite_data["period_min"] = round(compute_orbital_period_minutes(satellite_data["altitude_km"]), 2)

    sat_id = satellite_data.get("id") or f"SAT-{uuid.uuid4().hex[:6].upper()}"
    satellite_record = {
        **satellite_data,
        "id": sat_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _SATELLITES_STORE[sat_id] = satellite_record

    # Ensure debris items have computed periods
    processed_debris: List[Dict[str, Any]] = []
    for deb in debris_list:
        if not deb.get("period_min"):
            deb["period_min"] = round(compute_orbital_period_minutes(deb["altitude_km"]), 2)
        deb_id = deb.get("id") or f"DEB-{uuid.uuid4().hex[:6].upper()}"
        deb_rec = {
            **deb,
            "id": deb_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        processed_debris.append(deb_rec)
        _DEBRIS_STORE[deb_id] = deb_rec

    # Execute batch pairwise screening
    encounters = analyze_encounters_batch(
        satellite=satellite_record,
        debris_list=processed_debris,
        duration_hours=duration_hours,
        timestep_seconds=timestep_seconds,
    )

    closest_dist = encounters[0]["min_distance_km"] if encounters else None
    high_risk_count = sum(1 for e in encounters if e["risk_level"] in [RISK_CRITICAL, RISK_HIGH])

    analysis_result = {
        "analysis_id": analysis_id,
        "status": "COMPLETED",
        "satellite": satellite_record,
        "objects_analyzed": len(processed_debris),
        "potential_encounters": len(encounters),
        "closest_approach_km": closest_dist,
        "high_risk_count": high_risk_count,
        "duration_hours": duration_hours,
        "timestep_seconds": timestep_seconds,
        "encounters": encounters,
        "model_label": MODEL_LABEL,
        "disclaimer": MODEL_DISCLAIMER,
        "unmodeled_effects": UNMODELED_EFFECTS,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _ANALYSES_STORE[analysis_id] = analysis_result

    # Try optional Supabase sync if configured
    try_persist_to_supabase(analysis_result)

    return analysis_result

def try_persist_to_supabase(analysis_result: Dict[str, Any]):
    """Attempts to write analysis snapshot to Supabase if configured."""
    client = get_supabase_client()
    if not client:
        return
    try:
        sat = analysis_result.get("satellite") or {}
        if sat and "id" in sat:
            client.table("satellites").upsert({
                "id": sat["id"],
                "name": sat.get("name", "Unknown Satellite"),
                "altitude_km": float(sat.get("altitude_km", 500.0)),
                "inclination_deg": float(sat.get("inclination_deg", 97.5)),
                "period_min": float(sat.get("period_min", 95.0)),
                "phase_deg": float(sat.get("phase_deg", 0.0)),
                "raan_deg": float(sat.get("raan_deg", 0.0)),
                "source": sat.get("source", "ISRO Telemetry / Ephemeris"),
                "is_active": True,
            }).execute()

        client.table("analyses").upsert({
            "id": analysis_result["analysis_id"],
            "satellite_id": sat["id"],
            "status": analysis_result["status"],
            "objects_analyzed": analysis_result["objects_analyzed"],
            "potential_encounters": analysis_result.get("potential_encounters", len(analysis_result.get("encounters", []))),
            "closest_approach_km": analysis_result["closest_approach_km"],
            "high_risk_count": analysis_result["high_risk_count"],
            "duration_hours": analysis_result["duration_hours"],
            "timestep_seconds": analysis_result["timestep_seconds"],
            "model_label": analysis_result.get("model_label", "SIMPLIFIED KEPLERIAN MODEL · APPROXIMATE RESULTS"),
            "created_at": analysis_result["created_at"],
        }).execute()

        encounters = analysis_result.get("encounters", [])
        if encounters:
            encounter_records = []
            for e in encounters:
                encounter_records.append({
                    "id": e.get("id") or f"ENC-{analysis_result['analysis_id']}-{e.get('debris_id', 'UNK')}",
                    "analysis_id": analysis_result["analysis_id"],
                    "rank": e.get("rank", 1),
                    "satellite_id": e.get("satellite_id", sat["id"]),
                    "satellite_name": e.get("satellite_name", sat.get("name", "Asset")),
                    "debris_id": e.get("debris_id", "UNK"),
                    "debris_name": e.get("debris_name", "Debris Object"),
                    "min_distance_km": float(e.get("min_distance_km", 9999.0)),
                    "tca_seconds": float(e.get("tca_seconds", 0.0)),
                    "tca_utc": str(e.get("tca_utc", "")),
                    "relative_velocity_kms": float(e.get("relative_velocity_kms", 0.0)),
                    "risk_level": str(e.get("risk_level", "LOW")),
                    "model": "Simplified Keplerian Propagation",
                    "trajectory_sample": e.get("trajectory_sample", []),
                })
            client.table("encounters").upsert(encounter_records).execute()
    except Exception as err:
        # Graceful fallback: local store remains intact
        print(f"[Supabase Sync] Non-fatal sync notice: {err}")


def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    return _ANALYSES_STORE.get(analysis_id)

def get_all_analyses() -> List[Dict[str, Any]]:
    return list(_ANALYSES_STORE.values())

def get_demo_analysis_run() -> Dict[str, Any]:
    """
    Returns an existing or newly executed demonstration run using
    Cartosat-3 and the standard ISRO LEO debris catalog.
    """
    demo_id = "ANL-DEMO-ISRO-01"
    if demo_id in _ANALYSES_STORE:
        return _ANALYSES_STORE[demo_id]

    cartosat = DEMO_SATELLITES[0]
    debris_catalog = get_demo_debris()
    return execute_analysis_run(
        satellite_data=cartosat,
        debris_list=debris_catalog,
        duration_hours=24.0,
        timestep_seconds=60.0,
        analysis_id=demo_id,
    )

def get_satellites_catalog() -> List[Dict[str, Any]]:
    return list(_SATELLITES_STORE.values())

def save_satellite(sat_data: Dict[str, Any]) -> Dict[str, Any]:
    sat_id = sat_data.get("id") or f"SAT-{uuid.uuid4().hex[:6].upper()}"
    sat_record = {
        **sat_data,
        "id": sat_id,
        "period_min": round(compute_orbital_period_minutes(sat_data["altitude_km"]), 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _SATELLITES_STORE[sat_id] = sat_record
    return sat_record

def delete_satellite(sat_id: str) -> bool:
    if sat_id in _SATELLITES_STORE:
        del _SATELLITES_STORE[sat_id]
        return True
    return False

def get_debris_catalog() -> List[Dict[str, Any]]:
    return list(_DEBRIS_STORE.values())

def save_debris(deb_data: Dict[str, Any]) -> Dict[str, Any]:
    deb_id = deb_data.get("id") or f"DEB-{uuid.uuid4().hex[:6].upper()}"
    deb_record = {
        **deb_data,
        "id": deb_id,
        "period_min": round(compute_orbital_period_minutes(deb_data["altitude_km"]), 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _DEBRIS_STORE[deb_id] = deb_record
    return deb_record

def delete_debris(deb_id: str) -> bool:
    if deb_id in _DEBRIS_STORE:
        del _DEBRIS_STORE[deb_id]
        return True
    return False
