"""
AgriShield Alerts Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging

from database import get_db
from models.models import User
from services.auth_service import get_current_user_optional
from services.alerts_service import handle_detection
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class PestDetectedRequest(BaseModel):
    pest_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PestDetectedResponse(BaseModel):
    detection_id: str
    farmers_alerted: int
    message: str


class NearbyAlertResponse(BaseModel):
    id: str
    pest_name: str
    confidence: float
    severity: str
    latitude: float
    longitude: float
    distance_m: float
    created_at: datetime
    farmer_name: Optional[str] = None


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float


# ─────────────────────────────────────────────
# POST: PEST DETECTED
# ─────────────────────────────────────────────

@router.post("/pest-detected", response_model=PestDetectedResponse)
async def pest_detected(
    body: PestDetectedRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    result = await handle_detection(
        db=db,
        pest_name=body.pest_name,
        confidence=body.confidence,
        severity=body.severity,
        lat=body.latitude,
        lng=body.longitude,
        user=current_user
    )

    return PestDetectedResponse(
        detection_id=result["detection_id"],
        farmers_alerted=result["farmers_alerted"],
        message="Detection recorded and alerts processed"
    )


# ─────────────────────────────────────────────
# GET: NEARBY ALERTS
# ─────────────────────────────────────────────

@router.get("/nearby", response_model=List[NearbyAlertResponse])
def get_nearby_alerts(
    lat: float,
    lng: float,
    radius: int = 5000,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if radius > 50000:
        raise HTTPException(status_code=400, detail="Max radius is 50km")

    query = text("""
        SELECT 
            pd.id,
            pd.pest_name,
            pd.confidence,
            pd.severity,
            pd.latitude,
            pd.longitude,
            pd.created_at,
            COALESCE(u.name, 'Anonymous Farmer') as farmer_name,
            ST_Distance(
                pd.location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            ) AS distance_m
        FROM pest_detections pd
        LEFT JOIN users u ON u.id = pd.user_id
        WHERE 
            pd.location IS NOT NULL
            AND ST_DWithin(
                pd.location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            AND pd.created_at > NOW() - INTERVAL '7 days'
        ORDER BY pd.created_at DESC
        LIMIT :limit
    """)

    rows = db.execute(query, {
        "lat": lat,
        "lng": lng,
        "radius": radius,
        "limit": limit
    }).fetchall()

    return [
        NearbyAlertResponse(
            id=str(r.id),
            pest_name=r.pest_name,
            confidence=r.confidence,
            severity=r.severity,
            latitude=r.latitude,
            longitude=r.longitude,
            distance_m=round(r.distance_m, 1),
            created_at=r.created_at,
            farmer_name=r.farmer_name,
        )
        for r in rows
    ]


# ─────────────────────────────────────────────
# GET: HEATMAP
# ─────────────────────────────────────────────

@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_data(
    lat: float,
    lng: float,
    radius: int = 50000,
    db: Session = Depends(get_db),
):
    severity_weights = {
        "critical": 1.0,
        "high": 0.75,
        "medium": 0.5,
        "low": 0.25
    }

    query = text("""
        SELECT latitude, longitude, confidence, severity
        FROM pest_detections
        WHERE 
            location IS NOT NULL
            AND ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            AND created_at > NOW() - INTERVAL '30 days'
        LIMIT 1000
    """)

    rows = db.execute(query, {
        "lat": lat,
        "lng": lng,
        "radius": radius
    }).fetchall()

    return [
        HeatmapPoint(
            lat=r.latitude,
            lng=r.longitude,
            intensity=min(1.0, r.confidence * severity_weights.get(r.severity, 0.5))
        )
        for r in rows
    ]