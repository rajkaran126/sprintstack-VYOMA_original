"""
ORBITAL Scientific Engine - Keplerian Orbital Propagation
Implements standard circular/Keplerian mechanics for satellite and space debris orbits.
"""

import math
from typing import Tuple, List, Dict, Any
import numpy as np
from app.core.constants import EARTH_RADIUS_KM, MU_EARTH_KM3_S2

def compute_semi_major_axis(altitude_km: float) -> float:
    """Calculate geocentric orbital radius (semi-major axis for circular orbit)."""
    return EARTH_RADIUS_KM + float(altitude_km)

def compute_mean_motion(r_km: float) -> float:
    """
    Calculate orbital mean motion n (rad/s).
    n = sqrt(mu / r^3)
    """
    return math.sqrt(MU_EARTH_KM3_S2 / (r_km ** 3))

def compute_orbital_period_seconds(altitude_km: float) -> float:
    """Compute orbital period in seconds: T = 2 * pi * sqrt(r^3 / mu)."""
    r = compute_semi_major_axis(altitude_km)
    n = compute_mean_motion(r)
    return (2.0 * math.pi) / n

def compute_orbital_period_minutes(altitude_km: float) -> float:
    """Compute orbital period in minutes."""
    return compute_orbital_period_seconds(altitude_km) / 60.0

def compute_orbital_velocity(altitude_km: float) -> float:
    """Compute circular orbital speed (km/s): v = sqrt(mu / r)."""
    r = compute_semi_major_axis(altitude_km)
    return math.sqrt(MU_EARTH_KM3_S2 / r)

def propagate_circular_orbit_vectorized(
    altitude_km: float,
    inclination_deg: float,
    raan_deg: float,
    phase_deg: float,
    times_seconds: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Propagate a circular orbit over a vector of timestamps.
    
    Coordinate System: Earth-Centered Inertial (ECI).
    Orientation parameters:
      - i: Inclination
      - Omega: Right Ascension of Ascending Node (RAAN)
      - theta(t): Argument of latitude / true anomaly = theta_0 + n * t
      
    Returns:
      positions: ndarray of shape (N, 3) in kilometers [X, Y, Z]
      velocities: ndarray of shape (N, 3) in km/s [Vx, Vy, Vz]
    """
    r = compute_semi_major_axis(altitude_km)
    n = compute_mean_motion(r)
    v = math.sqrt(MU_EARTH_KM3_S2 / r)

    # Radians conversion
    inc_rad = math.radians(inclination_deg)
    raan_rad = math.radians(raan_deg)
    theta0_rad = math.radians(phase_deg)

    # Time-dependent angle theta(t)
    theta = theta0_rad + n * times_seconds

    sin_theta = np.sin(theta)
    cos_theta = np.cos(theta)

    cos_raan = math.cos(raan_rad)
    sin_raan = math.sin(raan_rad)
    cos_inc = math.cos(inc_rad)
    sin_inc = math.sin(inc_rad)

    # ECI Position components
    # X = r * (cos(Omega)*cos(theta) - sin(Omega)*sin(theta)*cos(i))
    # Y = r * (sin(Omega)*cos(theta) + cos(Omega)*sin(theta)*cos(i))
    # Z = r * (sin(theta)*sin(i))
    x = r * (cos_raan * cos_theta - sin_raan * sin_theta * cos_inc)
    y = r * (sin_raan * cos_theta + cos_raan * sin_theta * cos_inc)
    z = r * (sin_theta * sin_inc)

    positions = np.stack([x, y, z], axis=-1)

    # ECI Velocity components
    # d/dt cos(theta) = -n * sin(theta); d/dt sin(theta) = n * cos(theta); n * r = v
    # Vx = v * (-cos(Omega)*sin(theta) - sin(Omega)*cos(theta)*cos(i))
    # Vy = v * (-sin(Omega)*sin(theta) + cos(Omega)*cos(theta)*cos(i))
    # Vz = v * (cos(theta)*sin(i))
    vx = v * (-cos_raan * sin_theta - sin_raan * cos_theta * cos_inc)
    vy = v * (-sin_raan * sin_theta + cos_raan * cos_theta * cos_inc)
    vz = v * (cos_theta * sin_inc)

    velocities = np.stack([vx, vy, vz], axis=-1)

    return positions, velocities

def generate_orbit_path_points(
    altitude_km: float,
    inclination_deg: float,
    raan_deg: float = 0.0,
    num_points: int = 128
) -> List[List[float]]:
    """
    Generate a full 360-degree closed orbit ellipse/circle in 3D ECI space.
    Used for 3D path visualization in Three.js.
    """
    angles = np.linspace(0, 2 * np.pi, num_points, endpoint=True)
    r = compute_semi_major_axis(altitude_km)
    
    inc_rad = math.radians(inclination_deg)
    raan_rad = math.radians(raan_deg)
    
    cos_raan = math.cos(raan_rad)
    sin_raan = math.sin(raan_rad)
    cos_inc = math.cos(inc_rad)
    sin_inc = math.sin(inc_rad)

    cos_ang = np.cos(angles)
    sin_ang = np.sin(angles)

    x = r * (cos_raan * cos_ang - sin_raan * sin_ang * cos_inc)
    y = r * (sin_raan * cos_ang + cos_raan * sin_ang * cos_inc)
    z = r * (sin_ang * sin_inc)

    points = np.stack([x, y, z], axis=-1)
    return points.round(2).tolist()
