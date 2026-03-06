"""
AgriShield Alerts Router
=========================
POST /api/alerts/pest-detected  — Save detection, find nearby farmers (PostGIS ST_DWithin),
                                   send push notifications to all within 5km radius.
GET  /api/alerts/nearby         — Get detections within radius of a coordinate.
GET  /api/alerts/heatmap        — Return heatmap data points for the front-end.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import json
import logging

from database import get_db
from models.models import PestDetection, User, PushSubscription
from services.auth_service import get_current_user_optional
from services.push_service import send_push_notification
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Schemas ────────────────────────────────────────────────────────────────────

class PestDetectedRequest(BaseModel):
    pest_name:       str
    confidence:      float = Field(..., ge=0.0, le=1.0)
    severity:        str   = Field(..., pattern="^(low|medium|high|critical)$")
    latitude:        float = Field(..., ge=-90,  le=90)
    longitude:       float = Field(..., ge=-180, le=180)
    raw_predictions: Optional[List[dict]] = None


class PestDetectedResponse(BaseModel):
    detection_id:    str
    alert_sent:      bool
    farmers_alerted: int
    message:         str


class NearbyAlertResponse(BaseModel):
    id:         str
    pest_name:  str
    confidence: float
    severity:   str
    latitude:   float
    longitude:  float
    distance_m: float
    created_at: datetime
    farmer_name: Optional[str] = None


class HeatmapPoint(BaseModel):
    lat:       float
    lng:       float
    intensity: float   # 0.0 - 1.0


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/pest-detected", response_model=PestDetectedResponse, status_code=status.HTTP_201_CREATED)
async def pest_detected(
    body:             PestDetectedRequest,
    background_tasks: BackgroundTasks,
    db:               Session = Depends(get_db),
    current_user:     Optional[User] = Depends(get_current_user_optional),
):
    """
    Main detection endpoint:
    1. Save detection to DB with PostGIS point
    2. Query farmers within 5km using ST_DWithin (index-accelerated)
    3. Send web push notifications in background
    """

    # ── 1. Save detection ──────────────────────────────────────────────────────
    wkt_point = f"SRID=4326;POINT({body.longitude} {body.latitude})"

    detection = PestDetection(
        user_id         = current_user.id if current_user else None,
        pest_name       = body.pest_name,
        confidence      = body.confidence,
        severity        = body.severity,
        latitude        = body.latitude,
        longitude       = body.longitude,
        location        = wkt_point,
        raw_predictions = body.raw_predictions,
        alert_sent      = False,
        alert_count     = 0,
    )
    db.add(detection)
    db.flush()  # Get the ID before commit

    # ── 2. Find nearby farmers (PostGIS ST_DWithin) ────────────────────────────
    radius_m = settings.ALERT_RADIUS_METERS  # 5000m = 5km

    nearby_query = text("""
        SELECT 
            u.id,
            u.name,
            ST_Distance(
                u.location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            ) AS distance_m
        FROM users u
        JOIN push_subscriptions ps ON ps.user_id = u.id
        WHERE 
            u.location IS NOT NULL
            AND u.is_active = true
            AND u.id != :reporter_id
            AND ST_DWithin(
                u.location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
        ORDER BY distance_m ASC
        LIMIT 500
    """)

    result = db.execute(nearby_query, {
        "lat":         body.latitude,
        "lng":         body.longitude,
        "radius":      radius_m,
        "reporter_id": str(current_user.id) if current_user else "00000000-0000-0000-0000-000000000000",
    })
    nearby_users = result.fetchall()
    farmers_alerted = len(nearby_users)

    # ── 3. Fetch push subscriptions for nearby users ───────────────────────────
    if nearby_users:
        user_ids = [str(row.id) for row in nearby_users]
        subscriptions = (
            db.query(PushSubscription)
            .filter(PushSubscription.user_id.in_(user_ids))
            .all()
        )

        # Build notification payload
        severity_emoji = {
            "critical": "🚨",
            "high":     "⚠️",
            "medium":   "🟡",
            "low":      "🟢",
        }.get(body.severity, "⚠️")

        notification_payload = {
            "title":   f"{severity_emoji} AgriShield Alert — {body.severity.upper()} Risk",
            "body":    f"{body.pest_name} detected within 5km of your farm! Confidence: {body.confidence*100:.0f}%",
            "icon":    "/icons/icon-192x192.png",
            "badge":   "/icons/badge-72x72.png",
            "data": {
                "url":          "/dashboard",
                "detection_id": str(detection.id),
                "pest_name":    body.pest_name,
                "severity":     body.severity,
                "latitude":     body.latitude,
                "longitude":    body.longitude,
            },
            "actions": [
                {"action": "view",    "title": "View on Map"},
                {"action": "dismiss", "title": "Dismiss"},
            ],
        }

        # Send in background so request returns immediately
        background_tasks.add_task(
            send_push_notifications_batch,
            subscriptions,
            notification_payload
        )

        detection.alert_sent  = True
        detection.alert_count = farmers_alerted

    db.commit()
    db.refresh(detection)

    logger.info(f"Detection saved: {detection.id}, alerted {farmers_alerted} farmers")

    return PestDetectedResponse(
        detection_id    = str(detection.id),
        alert_sent      = detection.alert_sent,
        farmers_alerted = farmers_alerted,
        message         = f"Detection recorded. {farmers_alerted} farmers within 5km have been notified.",
    )


async def send_push_notifications_batch(subscriptions: list, payload: dict):
    """Background task: send push to all subscriptions."""
    success, failed = 0, 0
    for sub in subscriptions:
        try:
            await send_push_notification(
                endpoint  = sub.endpoint,
                p256dh    = sub.p256dh_key,
                auth      = sub.auth_key,
                payload   = payload,
            )
            success += 1
        except Exception as e:
            failed += 1
            logger.warning(f"Push failed for {sub.endpoint[:60]}: {e}")
    
    logger.info(f"Push batch complete: {success} sent, {failed} failed")


@router.get("/nearby", response_model=List[NearbyAlertResponse])
def get_nearby_alerts(
    lat:    float,
    lng:    float,
    radius: int  = 5000,
    limit:  int  = 50,
    db:     Session = Depends(get_db),
):
    """
    Get all recent pest detections within `radius` meters of (lat, lng).
    Uses PostGIS ST_DWithin with geography cast for accurate meter-based distance.
    """
    if radius > 50000:
        raise HTTPException(status_code=400, detail="Maximum radius is 50km")

    query = text("""
        SELECT 
            pd.id,
            pd.pest_name,
            pd.confidence,
            pd.severity,
            pd.latitude,
            pd.longitude,
            pd.created_at,
            u.name as farmer_name,
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

    rows = db.execute(query, {"lat": lat, "lng": lng, "radius": radius, "limit": limit}).fetchall()

    return [
        NearbyAlertResponse(
            id          = str(r.id),
            pest_name   = r.pest_name,
            confidence  = r.confidence,
            severity    = r.severity,
            latitude    = r.latitude,
            longitude   = r.longitude,
            distance_m  = round(r.distance_m, 1),
            created_at  = r.created_at,
            farmer_name = r.farmer_name,
        )
        for r in rows
    ]


@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_data(
    lat:    float,
    lng:    float,
    radius: int = 50000,   # 50km default for heatmap
    db:     Session = Depends(get_db),
):
    """
    Return heatmap data points for the front-end Leaflet heatmap.
    Intensity is calculated from confidence × severity_weight.
    """
    severity_weights = {"critical": 1.0, "high": 0.75, "medium": 0.5, "low": 0.25}

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
        ORDER BY created_at DESC
        LIMIT 1000
    """)

    rows = db.execute(query, {"lat": lat, "lng": lng, "radius": radius}).fetchall()

    points = []
    for r in rows:
        weight = severity_weights.get(r.severity, 0.5)
        intensity = min(1.0, r.confidence * weight)
        points.append(HeatmapPoint(lat=r.latitude, lng=r.longitude, intensity=intensity))

    return points
