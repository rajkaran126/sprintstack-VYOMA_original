"""
ORBITAL Physical and Astrodynamical Constants
"""

# Earth Geodetic Constants (WGS-84 approximate sphere)
EARTH_RADIUS_KM = 6378.137  # Equatorial radius in km
MU_EARTH_KM3_S2 = 398600.4418  # Standard gravitational parameter (km^3 / s^2)
EARTH_ROTATION_RATE_RAD_S = 7.2921159e-5  # Earth rotation rate in rad/s

# Risk Screening Thresholds (in kilometers)
RISK_THRESHOLD_CRITICAL_KM = 5.0
RISK_THRESHOLD_HIGH_KM = 15.0
RISK_THRESHOLD_MODERATE_KM = 50.0

# Risk Classifications
RISK_CRITICAL = "CRITICAL"
RISK_HIGH = "HIGH"
RISK_MODERATE = "MODERATE"
RISK_LOW = "LOW"

# System Branding & Disclaimers
ORGANIZATION_NAME = "Department of Space — ISRO"
PLATFORM_NAME = "VYOMA"
SYSTEM_TITLE = "Space Debris Collision Risk Estimator"
MODEL_LABEL = "SIMPLIFIED KEPLERIAN MODEL · APPROXIMATE RESULTS"
MODEL_DISCLAIMER = (
    "APPROXIMATE SCREENING — Simplified Keplerian propagation. "
    "Not intended for operational collision avoidance."
)

UNMODELED_EFFECTS = [
    "Atmospheric drag (orbital decay for Low Earth Orbit below 600km)",
    "Earth geopotential J2 and higher-order tesseral/sectorial harmonics",
    "Solar Radiation Pressure (SRP) perturbation on high area-to-mass debris",
    "Third-body gravitational perturbations (Lunar and Solar gravitation)",
    "Active satellite collision avoidance maneuvers or thruster firings",
    "Conjunction Assessment Covariance matrices and tracking positional uncertainties",
]
