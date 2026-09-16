from fastapi import APIRouter, HTTPException
from app.models.schemas import EncounterSummary
from app.services.analysis_service import get_all_analyses, get_demo_analysis_run

router = APIRouter(prefix="/encounters", tags=["Encounters"])

@router.get("/{encounter_id}", response_model=EncounterSummary)
def get_encounter_by_id(encounter_id: str):
    """Search for an encounter across completed analyses."""
    # Ensure demo analysis exists for lookup
    get_demo_analysis_run()

    for analysis in get_all_analyses():
        for enc in analysis.get("encounters", []):
            if enc.get("id") == encounter_id or enc.get("debris_id") == encounter_id:
                return enc

    raise HTTPException(status_code=404, detail=f"Encounter '{encounter_id}' not found.")
