from fastapi import APIRouter
from app.core.config import settings
from app.core.constants import ORGANIZATION_NAME, PLATFORM_NAME

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_system_health():
    groq_active = bool(settings.GROQ_API_KEY.strip())
    supabase_active = bool(settings.SUPABASE_URL.strip() and settings.SUPABASE_SERVICE_ROLE_KEY.strip())
    return {
        "status": "operational",
        "platform": PLATFORM_NAME,
        "organization": ORGANIZATION_NAME,
        "groq_configured": groq_active,
        "supabase_configured": supabase_active,
        "version": settings.VERSION,
    }
