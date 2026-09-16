from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import DebrisCreate, DebrisResponse, CSVImportResponse
from app.services.analysis_service import (
    get_debris_catalog,
    save_debris,
    delete_debris,
)
from app.services.dataset_service import parse_and_validate_debris_csv

router = APIRouter(prefix="/debris", tags=["Debris"])

@router.get("", response_model=List[DebrisResponse])
def list_debris():
    return get_debris_catalog()

@router.post("", response_model=DebrisResponse)
def create_debris_object(payload: DebrisCreate):
    created = save_debris(payload.model_dump())
    return created

@router.post("/import", response_model=CSVImportResponse)
async def import_debris_csv(file: UploadFile = File(...)):
    """
    Accepts CSV upload, performs rigorous schema and value validation,
    and returns parsed debris records or granular line-by-line errors.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content_bytes = await file.read()
    try:
        csv_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content_bytes.decode("latin-1")

    valid_records, errors = parse_and_validate_debris_csv(csv_text)

    saved_items = []
    if valid_records:
        for rec in valid_records:
            saved = save_debris(rec)
            saved_items.append(saved)

    return CSVImportResponse(
        success=len(errors) == 0,
        imported_count=len(saved_items),
        errors=errors,
        items=saved_items,
    )

@router.delete("/{debris_id}")
def remove_debris_object(debris_id: str):
    success = delete_debris(debris_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Debris object '{debris_id}' not found.")
    return {"success": True, "message": f"Debris '{debris_id}' deleted."}
