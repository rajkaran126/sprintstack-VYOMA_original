import math
import numpy as np
import pytest
from app.core.constants import EARTH_RADIUS_KM, MU_EARTH_KM3_S2
from app.services.orbital_service import (
    compute_semi_major_axis,
    compute_mean_motion,
    compute_orbital_period_minutes,
    compute_orbital_velocity,
    propagate_circular_orbit_vectorized,
    generate_orbit_path_points,
)

def test_semi_major_axis():
    alt = 500.0
    expected = EARTH_RADIUS_KM + alt
    assert compute_semi_major_axis(alt) == pytest.approx(expected, rel=1e-5)

def test_mean_motion_and_period():
    # For LEO satellite at 500 km
    alt = 500.0
    r = EARTH_RADIUS_KM + alt
    n = compute_mean_motion(r)
    assert n > 0.001 and n < 0.002  # ~0.0011 rad/s
    period_min = compute_orbital_period_minutes(alt)
    # LEO orbit period should be approximately 94.6 minutes
    assert 90.0 < period_min < 100.0
    assert period_min == pytest.approx(94.6, abs=1.0)

def test_orbital_velocity():
    alt = 500.0
    v = compute_orbital_velocity(alt)
    # Typical LEO velocity is ~7.6 km/s
    assert 7.0 < v < 8.0

def test_circular_orbit_conservation():
    """Verify that geocentric distance r remains strictly constant throughout propagation."""
    alt = 550.0
    expected_r = EARTH_RADIUS_KM + alt
    times = np.linspace(0, 5400, 100)  # 90 minutes
    
    positions, velocities = propagate_circular_orbit_vectorized(
        altitude_km=alt,
        inclination_deg=45.0,
        raan_deg=30.0,
        phase_deg=0.0,
        times_seconds=times,
    )

    radii = np.linalg.norm(positions, axis=-1)
    speeds = np.linalg.norm(velocities, axis=-1)

    expected_speed = compute_orbital_velocity(alt)

    np.testing.assert_allclose(radii, expected_r, rtol=1e-5)
    np.testing.assert_allclose(speeds, expected_speed, rtol=1e-5)

def test_equatorial_vs_polar_orbits():
    times = np.array([0.0, 1000.0, 2000.0])
    alt = 600.0

    # Equatorial orbit (inclination = 0): Z should be 0
    pos_eq, _ = propagate_circular_orbit_vectorized(
        altitude_km=alt, inclination_deg=0.0, raan_deg=0.0, phase_deg=0.0, times_seconds=times
    )
    np.testing.assert_allclose(pos_eq[:, 2], 0.0, atol=1e-6)

    # Polar orbit (inclination = 90): Y should be 0 when RAAN=0
    pos_polar, _ = propagate_circular_orbit_vectorized(
        altitude_km=alt, inclination_deg=90.0, raan_deg=0.0, phase_deg=0.0, times_seconds=times
    )
    np.testing.assert_allclose(pos_polar[:, 1], 0.0, atol=1e-6)

def test_generate_orbit_path_points():
    points = generate_orbit_path_points(altitude_km=500.0, inclination_deg=53.0, num_points=64)
    assert len(points) == 64
    for pt in points:
        assert len(pt) == 3
        dist = math.sqrt(pt[0]**2 + pt[1]**2 + pt[2]**2)
        assert dist == pytest.approx(EARTH_RADIUS_KM + 500.0, abs=0.1)
