"""
ORBITAL Scientific Engine - Risk Calculation & Close Approach Screening
Calculates pairwise separation distances, Times of Closest Approach (TCA),
relative velocity vectors, and assigns approximate screening risk levels.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
import numpy as np

from app.core.constants import (
    RISK_THRESHOLD_CRITICAL_KM,
    RISK_THRESHOLD_HIGH_KM,
    RISK_THRESHOLD_MODERATE_KM,
    RISK_CRITICAL,
    RISK_HIGH,
    RISK_MODERATE,
    RISK_LOW,
)
from app.services.orbital_service import propagate_circular_orbit_vectorized

def classify_risk(min_distance_km: float) -> str:
    """Classify screening risk based on miss distance."""
    if min_distance_km < RISK_THRESHOLD_CRITICAL_KM:
        return RISK_CRITICAL
    elif min_distance_km < RISK_THRESHOLD_HIGH_KM:
        return RISK_HIGH
    elif min_distance_km < RISK_THRESHOLD_MODERATE_KM:
        return RISK_MODERATE
    return RISK_LOW

def format_relative_tca(seconds_from_start: float, base_time: datetime = None) -> str:
    """Format TCA into human-readable relative time and UTC string."""
    if base_time is None:
        base_time = datetime.now(timezone.utc)
    tca_dt = base_time + timedelta(seconds=seconds_from_start)
    return tca_dt.strftime("%Y-%m-%d %H:%M:%S UTC")

def refine_minimum_distance(
    sat_params: Dict[str, float],
    deb_params: Dict[str, float],
    t_coarse: float,
    dt_window: float = 120.0,
    steps: int = 241,
) -> Tuple[float, float, float]:
    """
    Perform localized sub-second numerical refinement around coarse sampled minimum.
    Returns:
      refined_tca_seconds, refined_min_distance_km, relative_velocity_kms
    """
    t_min = max(0.0, t_coarse - dt_window)
    t_max = t_coarse + dt_window
    refined_times = np.linspace(t_min, t_max, steps)

    sat_pos, sat_vel = propagate_circular_orbit_vectorized(
        sat_params["altitude_km"],
        sat_params["inclination_deg"],
        sat_params.get("raan_deg", 0.0),
        sat_params.get("phase_deg", 0.0),
        refined_times,
    )

    deb_pos, deb_vel = propagate_circular_orbit_vectorized(
        deb_params["altitude_km"],
        deb_params["inclination_deg"],
        deb_params.get("raan_deg", 0.0),
        deb_params.get("phase_deg", 0.0),
        refined_times,
    )

    diff_pos = sat_pos - deb_pos
    distances = np.linalg.norm(diff_pos, axis=-1)

    min_idx = np.argmin(distances)
    best_t = float(refined_times[min_idx])
    best_dist = float(distances[min_idx])

    # Relative velocity at TCA
    diff_vel = sat_vel[min_idx] - deb_vel[min_idx]
    rel_vel_mag = float(np.linalg.norm(diff_vel))

    return best_t, best_dist, rel_vel_mag

def generate_trajectory_sample_around_tca(
    sat_params: Dict[str, float],
    deb_params: Dict[str, float],
    tca_seconds: float,
    half_window_minutes: float = 60.0,
    num_samples: int = 61,
    base_time: datetime = None
) -> List[Dict[str, Any]]:
    """
    Sample distance vs time for 1 hour before and after TCA for plotting.
    """
    if base_time is None:
        base_time = datetime.now(timezone.utc)

    window_sec = half_window_minutes * 60.0
    t_start = max(0.0, tca_seconds - window_sec)
    t_end = tca_seconds + window_sec
    sample_times = np.linspace(t_start, t_end, num_samples)

    sat_pos, _ = propagate_circular_orbit_vectorized(
        sat_params["altitude_km"],
        sat_params["inclination_deg"],
        sat_params.get("raan_deg", 0.0),
        sat_params.get("phase_deg", 0.0),
        sample_times,
    )

    deb_pos, _ = propagate_circular_orbit_vectorized(
        deb_params["altitude_km"],
        deb_params["inclination_deg"],
        deb_params.get("raan_deg", 0.0),
        deb_params.get("phase_deg", 0.0),
        sample_times,
    )

    distances = np.linalg.norm(sat_pos - deb_pos, axis=-1)

    samples = []
    for i, t in enumerate(sample_times):
        dt_point = base_time + timedelta(seconds=float(t))
        samples.append({
            "time_seconds": round(float(t), 1),
            "time_utc_rel": dt_point.strftime("%H:%M:%S"),
            "distance_km": round(float(distances[i]), 2),
            "sat_pos": [round(float(coord), 2) for coord in sat_pos[i]],
            "deb_pos": [round(float(coord), 2) for coord in deb_pos[i]],
        })

    return samples

def analyze_encounters_batch(
    satellite: Dict[str, Any],
    debris_list: List[Dict[str, Any]],
    duration_hours: float = 24.0,
    timestep_seconds: float = 60.0,
    base_time: datetime = None
) -> List[Dict[str, Any]]:
    """
    Screen all debris objects against the primary satellite.
    Propagates the satellite trajectory once, then checks each debris trajectory.
    """
    if base_time is None:
        base_time = datetime.now(timezone.utc)

    total_seconds = duration_hours * 3600.0
    times = np.arange(0.0, total_seconds, timestep_seconds)

    # Propagate primary satellite once
    sat_params = {
        "altitude_km": satellite["altitude_km"],
        "inclination_deg": satellite["inclination_deg"],
        "raan_deg": satellite.get("raan_deg", 0.0),
        "phase_deg": satellite.get("phase_deg", 0.0),
    }

    sat_positions, sat_velocities = propagate_circular_orbit_vectorized(
        sat_params["altitude_km"],
        sat_params["inclination_deg"],
        sat_params["raan_deg"],
        sat_params["phase_deg"],
        times,
    )

    results = []

    for debris in debris_list:
        deb_params = {
            "altitude_km": debris["altitude_km"],
            "inclination_deg": debris["inclination_deg"],
            "raan_deg": debris.get("raan_deg", 0.0),
            "phase_deg": debris.get("phase_deg", 0.0),
        }

        deb_positions, deb_velocities = propagate_circular_orbit_vectorized(
            deb_params["altitude_km"],
            deb_params["inclination_deg"],
            deb_params["raan_deg"],
            deb_params["phase_deg"],
            times,
        )

        diff = sat_positions - deb_positions
        coarse_distances = np.linalg.norm(diff, axis=-1)

        coarse_min_idx = int(np.argmin(coarse_distances))
        coarse_tca = float(times[coarse_min_idx])

        # Sub-second refinement around the coarse minimum
        refined_tca, min_dist, rel_vel = refine_minimum_distance(
            sat_params, deb_params, coarse_tca, dt_window=min(180.0, timestep_seconds * 2)
        )

        risk_lvl = classify_risk(min_dist)

        # Generate trajectory sample around TCA
        sample = generate_trajectory_sample_around_tca(
            sat_params, deb_params, refined_tca, half_window_minutes=45.0, num_samples=41, base_time=base_time
        )

        results.append({
            "debris_id": debris["id"],
            "debris_name": debris["name"],
            "satellite_id": satellite.get("id", "SAT-ISRO-01"),
            "satellite_name": satellite["name"],
            "min_distance_km": round(min_dist, 3),
            "tca_seconds": round(refined_tca, 2),
            "tca_utc": format_relative_tca(refined_tca, base_time),
            "relative_velocity_kms": round(rel_vel, 2),
            "risk_level": risk_lvl,
            "trajectory_sample": sample,
        })

    # Sort results by ascending minimum distance (closest encounter first)
    results.sort(key=lambda x: x["min_distance_km"])

    # Assign ranks and IDs
    for idx, item in enumerate(results, start=1):
        item["rank"] = idx
        item["id"] = f"ENC-{idx:03d}"

    return results
