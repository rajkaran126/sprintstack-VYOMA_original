from typing import List
from fastapi import APIRouter, HTTPException
from app.models.schemas import SatelliteCreate, SatelliteResponse
from app.services.analysis_service import (
    get_satellites_catalog,
    save_satellite,
    delete_satellite,
)

router = APIRouter(prefix="/satellites", tags=["Satellites"])

@router.get("", response_model=List[SatelliteResponse])
def list_satellites():
    return get_satellites_catalog()

@router.post("", response_model=SatelliteResponse)
def create_satellite(payload: SatelliteCreate):
    created = save_satellite(payload.model_dump())
    return created

@router.delete("/{sat_id}")
def remove_satellite(sat_id: str):
    success = delete_satellite(sat_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Satellite '{sat_id}' not found.")
    return {"success": True, "message": f"Satellite '{sat_id}' removed from active catalog."}
