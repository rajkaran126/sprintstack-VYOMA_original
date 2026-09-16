try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.constants import ORGANIZATION_NAME, PLATFORM_NAME, SYSTEM_TITLE
from app.api.routers import health, satellites, debris, analysis, encounters, agent
from app.services.analysis_service import get_demo_analysis_run

app = FastAPI(
    title=f"{PLATFORM_NAME} - {SYSTEM_TITLE}",
    description=f"Scientific visualization and approximate orbital-risk screening platform for satellite operators. Organization: {ORGANIZATION_NAME}",
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows browser dev & preview environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(satellites.router, prefix=settings.API_V1_STR)
app.include_router(debris.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(encounters.router, prefix=settings.API_V1_STR)
app.include_router(agent.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    # Warm up demonstration run in memory so first loads are instantaneous
    try:
        get_demo_analysis_run()
        print("[ORBITAL Engine] Initialized demonstration run for Cartosat-3 and ISRO LEO catalog.")
    except Exception as e:
        print(f"[ORBITAL Engine] Startup notice: {e}")

@app.get("/")
def root():
    return {
        "platform": PLATFORM_NAME,
        "title": SYSTEM_TITLE,
        "organization": ORGANIZATION_NAME,
        "api_docs": "/api/docs",
        "version": settings.VERSION,
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
