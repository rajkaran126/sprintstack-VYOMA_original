"""
ORBITAL Dataset Service
Provides curated ISRO demonstration catalogs and CSV dataset import validation.
"""

import io
import csv
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from app.services.orbital_service import compute_orbital_period_minutes

DEMO_SATELLITES: List[Dict[str, Any]] = [
    {
        "id": "SAT-ISRO-01",
        "name": "Cartosat-3 (ISRO High-Res Imaging)",
        "altitude_km": 505.0,
        "inclination_deg": 97.5,
        "period_min": round(compute_orbital_period_minutes(505.0), 2),
        "phase_deg": 14.0,
        "raan_deg": 45.0,
        "source": "ISRO Telemetry / Ephemeris",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "SAT-ISRO-02",
        "name": "RISAT-2BR1 (Radar Imaging)",
        "altitude_km": 576.0,
        "inclination_deg": 37.0,
        "period_min": round(compute_orbital_period_minutes(576.0), 2),
        "phase_deg": 88.0,
        "raan_deg": 120.0,
        "source": "ISRO Telemetry / Ephemeris",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "SAT-ISRO-03",
        "name": "EOS-04 (All-Weather Earth Observation)",
        "altitude_km": 529.0,
        "inclination_deg": 97.5,
        "period_min": round(compute_orbital_period_minutes(529.0), 2),
        "phase_deg": 190.0,
        "raan_deg": 60.0,
        "source": "ISRO Telemetry / Ephemeris",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

DEMO_DEBRIS_OBJECTS: List[Dict[str, Any]] = [
    {
        "id": "DEB-1042",
        "name": "Cosmos-2251 Collision Fragment (1993-036PX)",
        "altitude_km": 506.8,
        "inclination_deg": 97.3,
        "period_min": round(compute_orbital_period_minutes(506.8), 2),
        "phase_deg": 14.15,
        "raan_deg": 45.2,
        "source": "USSPACECOM / Space-Track",
        "rcs_size": "MEDIUM",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-0887",
        "name": "Fengyun-1C Breakup Debris (1999-025BP)",
        "altitude_km": 508.5,
        "inclination_deg": 98.2,
        "period_min": round(compute_orbital_period_minutes(508.5), 2),
        "phase_deg": 15.0,
        "raan_deg": 46.1,
        "source": "Space-Track / ISRO SSA",
        "rcs_size": "SMALL",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-2104",
        "name": "Iridium-33 Derelict Antenna Fragment",
        "altitude_km": 503.2,
        "inclination_deg": 96.8,
        "period_min": round(compute_orbital_period_minutes(503.2), 2),
        "phase_deg": 12.8,
        "raan_deg": 44.1,
        "source": "Space-Track",
        "rcs_size": "SMALL",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-0419",
        "name": "SL-4 Spent Booster Stage Section",
        "altitude_km": 512.0,
        "inclination_deg": 97.0,
        "period_min": round(compute_orbital_period_minutes(512.0), 2),
        "phase_deg": 35.0,
        "raan_deg": 52.0,
        "source": "ISRO Radar Tracking",
        "rcs_size": "LARGE",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-0721",
        "name": "CZ-4C Debris Shard (2018-088J)",
        "altitude_km": 498.0,
        "inclination_deg": 97.8,
        "period_min": round(compute_orbital_period_minutes(498.0), 2),
        "phase_deg": 80.0,
        "raan_deg": 48.0,
        "source": "Space-Track",
        "rcs_size": "MEDIUM",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-3310",
        "name": "Pegasus Rocket Debris Piece",
        "altitude_km": 520.4,
        "inclination_deg": 94.1,
        "period_min": round(compute_orbital_period_minutes(520.4), 2),
        "phase_deg": 140.0,
        "raan_deg": 75.0,
        "source": "USSPACECOM",
        "rcs_size": "SMALL",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-1901",
        "name": "Thor-Able Star Debris Fragment",
        "altitude_km": 535.0,
        "inclination_deg": 66.5,
        "period_min": round(compute_orbital_period_minutes(535.0), 2),
        "phase_deg": 210.0,
        "raan_deg": 110.0,
        "source": "Space-Track",
        "rcs_size": "MEDIUM",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "DEB-5520",
        "name": "Micrometeoroid Impact Spall Fragment",
        "altitude_km": 490.2,
        "inclination_deg": 98.6,
        "period_min": round(compute_orbital_period_minutes(490.2), 2),
        "phase_deg": 280.0,
        "raan_deg": 190.0,
        "source": "ISRO SSA Optical Sensor",
        "rcs_size": "SMALL",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

def get_demo_satellites() -> List[Dict[str, Any]]:
    return [dict(s) for s in DEMO_SATELLITES]

def get_demo_debris() -> List[Dict[str, Any]]:
    return [dict(d) for d in DEMO_DEBRIS_OBJECTS]

def parse_and_validate_debris_csv(csv_content: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Validates and parses CSV with expected fields:
    object_id,altitude_km,inclination_deg,period_min,phase_deg,raan_deg,name
    """
    valid_records: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    seen_ids = set()

    try:
        reader = csv.DictReader(io.StringIO(csv_content.strip()))
    except Exception as e:
        return [], [{"row": 0, "column": None, "message": f"Malformed CSV structure: {str(e)}"}]

    if not reader.fieldnames:
        return [], [{"row": 0, "column": None, "message": "CSV file appears empty or lacks header"}]

    # Normalize header names (lowercase, stripped)
    normalized_headers = {h.strip().lower(): h for h in reader.fieldnames if h}
    
    # Check for required core column
    if "altitude_km" not in normalized_headers and "altitude" not in normalized_headers:
        errors.append({"row": 1, "column": "altitude_km", "message": "Missing required column 'altitude_km'"})
    if "inclination_deg" not in normalized_headers and "inclination" not in normalized_headers:
        errors.append({"row": 1, "column": "inclination_deg", "message": "Missing required column 'inclination_deg'"})

    if errors:
        return [], errors

    row_num = 1  # 1-indexed (header is row 1)
    for row in reader:
        row_num += 1
        # Extract fields with alias support
        raw_id = row.get("object_id") or row.get("id") or row.get("name") or f"DEB-CSV-{row_num}"
        object_id = raw_id.strip()
        
        name = row.get("name") or f"Fragment {object_id}"
        
        if not object_id:
            errors.append({"row": row_num, "column": "object_id", "message": "Object ID cannot be blank"})
            continue

        if object_id in seen_ids:
            errors.append({"row": row_num, "column": "object_id", "message": f"Duplicate object ID: '{object_id}'"})
            continue
        seen_ids.add(object_id)

        # Altitude
        raw_alt = row.get("altitude_km") or row.get("altitude")
        try:
            altitude_km = float(raw_alt)
            if altitude_km < 120.0 or altitude_km > 36000.0:
                errors.append({"row": row_num, "column": "altitude_km", "message": f"Altitude {altitude_km} km out of valid range [120, 36000]"})
                continue
        except (ValueError, TypeError):
            errors.append({"row": row_num, "column": "altitude_km", "message": f"Invalid numeric altitude '{raw_alt}'"})
            continue

        # Inclination
        raw_inc = row.get("inclination_deg") or row.get("inclination")
        try:
            inclination_deg = float(raw_inc)
            if inclination_deg < 0.0 or inclination_deg > 180.0:
                errors.append({"row": row_num, "column": "inclination_deg", "message": f"Inclination {inclination_deg}° out of range [0, 180]"})
                continue
        except (ValueError, TypeError):
            errors.append({"row": row_num, "column": "inclination_deg", "message": f"Invalid numeric inclination '{raw_inc}'"})
            continue

        # Optional Phase
        raw_phase = row.get("phase_deg") or row.get("phase") or "0.0"
        try:
            phase_deg = float(raw_phase) % 360.0
        except (ValueError, TypeError):
            phase_deg = 0.0

        # Optional RAAN
        raw_raan = row.get("raan_deg") or row.get("raan") or "0.0"
        try:
            raan_deg = float(raw_raan) % 360.0
        except (ValueError, TypeError):
            raan_deg = 0.0

        # Compute period
        period_min = round(compute_orbital_period_minutes(altitude_km), 2)

        valid_records.append({
            "id": object_id,
            "name": name.strip(),
            "altitude_km": altitude_km,
            "inclination_deg": inclination_deg,
            "period_min": period_min,
            "phase_deg": phase_deg,
            "raan_deg": raan_deg,
            "source": "Imported CSV Dataset",
            "rcs_size": row.get("rcs_size", "MEDIUM").strip().upper(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return valid_records, errors
