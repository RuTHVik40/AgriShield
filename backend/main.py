"""
AgriShield FastAPI Backend
Geospatial pest detection alerts + community + push notifications
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from routers import alerts, community, auth, push, health
from database import engine, Base

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgriShield API",
    description="Precision Agriculture backend — geospatial alerts, community feed, push notifications",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://agrishield.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(health.router,     prefix="/api",          tags=["Health"])
app.include_router(auth.router,       prefix="/api/auth",     tags=["Auth"])
app.include_router(alerts.router,     prefix="/api/alerts",   tags=["Alerts"])
app.include_router(community.router,  prefix="/api/community",tags=["Community"])
app.include_router(push.router,       prefix="/api/push",     tags=["Push Notifications"])

@app.get("/")
async def root():
    return {"app": "AgriShield API", "version": "1.0.0", "status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
