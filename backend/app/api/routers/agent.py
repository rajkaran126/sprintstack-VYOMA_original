from fastapi import APIRouter
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.services.groq_service import generate_orbital_ai_response
from app.services.analysis_service import get_analysis_by_id, get_demo_analysis_run

router = APIRouter(prefix="/agent", tags=["Orbital AI"])

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_orbital_ai(payload: ChatMessageRequest):
    """
    Server-side AI assistant proxy. Browser communicates only with FastAPI.
    Injects authoritative computed facts from active analysis and enforces
    demarcation between COMPUTED RESULT and AI INTERPRETATION.
    """
    analysis_data = None
    if payload.analysis_id:
        analysis_data = get_analysis_by_id(payload.analysis_id)
        if not analysis_data and payload.analysis_id == "ANL-DEMO-ISRO-01":
            analysis_data = get_demo_analysis_run()
    else:
        # Default to demo analysis context if available
        analysis_data = get_demo_analysis_run()

    selected_encounter = None
    if payload.selected_encounter_id and analysis_data:
        for enc in analysis_data.get("encounters", []):
            if enc.get("id") == payload.selected_encounter_id or enc.get("debris_id") == payload.selected_encounter_id:
                selected_encounter = enc
                break

    response = await generate_orbital_ai_response(
        query=payload.message,
        analysis_data=analysis_data,
        selected_encounter=selected_encounter,
        conversation_history=payload.conversation_history,
    )

    return ChatMessageResponse(
        reply=response["reply"],
        model_used=response["model_used"],
        computed_facts=response["computed_facts"],
        operational_interpretation=response["operational_interpretation"],
    )
