import io
import csv
from typing import List
from fastapi import APIRouter, HTTPException, Response
from app.models.schemas import AnalysisRunRequest, AnalysisResult, EncounterSummary
from app.services.analysis_service import (
    execute_analysis_run,
    get_analysis_by_id,
    get_all_analyses,
    get_demo_analysis_run,
    get_debris_catalog,
)
from app.services.dataset_service import get_demo_debris

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/demo", response_model=AnalysisResult)
def get_or_run_demo():
    """Returns authoritative demo analysis run for Cartosat-3 against ISRO LEO debris catalog."""
    return get_demo_analysis_run()

@router.post("", response_model=AnalysisResult)
def run_new_analysis(payload: AnalysisRunRequest):
    """Executes a new Keplerian orbital propagation and close-approach screening run."""
    sat_dict = payload.satellite.model_dump()

    # Determine debris list
    debris_list = []
    if payload.debris_objects and len(payload.debris_objects) > 0:
        debris_list = [d.model_dump() for d in payload.debris_objects]
    elif payload.dataset_id == "demo_isro_leo" or not payload.debris_objects:
        debris_list = get_debris_catalog()
        if not debris_list:
            debris_list = get_demo_debris()

    if not debris_list:
        raise HTTPException(
            status_code=400,
            detail="No debris objects provided or available in catalog for screening."
        )

    result = execute_analysis_run(
        satellite_data=sat_dict,
        debris_list=debris_list,
        duration_hours=payload.duration_hours,
        timestep_seconds=payload.timestep_seconds,
    )
    return result

@router.get("", response_model=List[AnalysisResult])
def list_analyses():
    return get_all_analyses()

@router.get("/{analysis_id}", response_model=AnalysisResult)
def get_analysis(analysis_id: str):
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        # Check if demo was requested
        if analysis_id == "ANL-DEMO-ISRO-01":
            return get_demo_analysis_run()
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")
    return analysis

@router.get("/{analysis_id}/encounters", response_model=List[EncounterSummary])
def get_analysis_encounters(analysis_id: str):
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        if analysis_id == "ANL-DEMO-ISRO-01":
            analysis = get_demo_analysis_run()
        else:
            raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")
    return analysis.get("encounters", [])

@router.get("/{analysis_id}/export")
def export_analysis_encounters_csv(analysis_id: str):
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        if analysis_id == "ANL-DEMO-ISRO-01":
            analysis = get_demo_analysis_run()
        else:
            raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")

    encounters = analysis.get("encounters", [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank",
        "Encounter_ID",
        "Satellite_Name",
        "Debris_ID",
        "Debris_Name",
        "Min_Distance_km",
        "TCA_UTC",
        "TCA_Seconds",
        "Relative_Velocity_kms",
        "Risk_Level",
        "Propagation_Model"
    ])

    for enc in encounters:
        writer.writerow([
            enc.get("rank"),
            enc.get("id"),
            enc.get("satellite_name"),
            enc.get("debris_id"),
            enc.get("debris_name"),
            enc.get("min_distance_km"),
            enc.get("tca_utc"),
            enc.get("tca_seconds"),
            enc.get("relative_velocity_kms"),
            enc.get("risk_level"),
            enc.get("model"),
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=orbital_encounters_{analysis_id}.csv"}
    )
