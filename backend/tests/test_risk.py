import pytest
from app.core.constants import RISK_CRITICAL, RISK_HIGH, RISK_MODERATE, RISK_LOW
from app.services.risk_service import classify_risk, analyze_encounters_batch

def test_risk_threshold_boundaries():
    assert classify_risk(0.5) == RISK_CRITICAL
    assert classify_risk(4.99) == RISK_CRITICAL
    assert classify_risk(5.0) == RISK_HIGH
    assert classify_risk(14.99) == RISK_HIGH
    assert classify_risk(15.0) == RISK_MODERATE
    assert classify_risk(49.99) == RISK_MODERATE
    assert classify_risk(50.0) == RISK_LOW
    assert classify_risk(120.0) == RISK_LOW

def test_close_approach_coplanar_trailing():
    """Two objects on the same orbit separated by a small phase angle."""
    satellite = {
        "id": "SAT-TEST",
        "name": "Primary Asset",
        "altitude_km": 500.0,
        "inclination_deg": 50.0,
        "raan_deg": 0.0,
        "phase_deg": 0.0,
    }
    debris_list = [
        {
            "id": "DEB-CLOSE",
            "name": "Nearby Fragment",
            "altitude_km": 500.0,
            "inclination_deg": 50.0,
            "raan_deg": 0.0,
            "phase_deg": 0.02,  # Very close trailing phase (~2.4 km along track)
        },
        {
            "id": "DEB-DISTANT",
            "name": "Distant Fragment",
            "altitude_km": 800.0,
            "inclination_deg": 20.0,
            "raan_deg": 180.0,
            "phase_deg": 90.0,
        }
    ]

    results = analyze_encounters_batch(
        satellite=satellite,
        debris_list=debris_list,
        duration_hours=2.0,
        timestep_seconds=60.0,
    )

    assert len(results) == 2
    # The closest object must be ranked first
    assert results[0]["debris_id"] == "DEB-CLOSE"
    assert results[0]["rank"] == 1
    assert results[0]["min_distance_km"] < 5.0
    assert results[0]["risk_level"] == RISK_CRITICAL
    assert len(results[0]["trajectory_sample"]) > 0

    assert results[1]["debris_id"] == "DEB-DISTANT"
    assert results[1]["min_distance_km"] > 50.0
