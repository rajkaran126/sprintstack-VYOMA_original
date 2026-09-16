import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "platform" in data
    assert "organization" in data

def test_satellites_catalog_endpoints():
    response = client.get("/api/satellites")
    assert response.status_code == 200
    sats = response.json()
    assert len(sats) >= 1
    assert any("Cartosat" in s["name"] for s in sats)

def test_debris_catalog_endpoints():
    response = client.get("/api/debris")
    assert response.status_code == 200
    debris = response.json()
    assert len(debris) >= 5

def test_demo_analysis_run():
    response = client.get("/api/analysis/demo")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["objects_analyzed"] >= 5
    assert len(data["encounters"]) >= 5
    assert data["encounters"][0]["rank"] == 1
    # Check that model disclaimer is present
    assert "KEPLERIAN" in data["model_label"].upper()
    assert "APPROXIMATE" in data["disclaimer"].upper()

def test_agent_chat_endpoint():
    # Chat without external Groq key falls back safely to internal physics engine
    payload = {
        "message": "Which debris object has the closest approach and what is the estimated risk?",
        "analysis_id": "ANL-DEMO-ISRO-01",
    }
    response = client.post("/api/agent/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "COMPUTED RESULT" in data["reply"]
    assert "AI OPERATIONAL INTERPRETATION" in data["reply"]
    assert len(data["computed_facts"]) > 0

def test_custom_analysis_run():
    payload = {
        "satellite": {
            "name": "GSAT-Custom-Test",
            "altitude_km": 550.0,
            "inclination_deg": 53.0,
            "phase_deg": 10.0,
            "raan_deg": 20.0
        },
        "duration_hours": 2.0,
        "timestep_seconds": 60.0
    }
    response = client.post("/api/analysis", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "COMPLETED"
    assert res["satellite"]["name"] == "GSAT-Custom-Test"
    assert len(res["encounters"]) > 0
