from sqlalchemy.orm import Session
from sqlalchemy import text
from models.models import PestDetection, PushSubscription
from services.push_service import send_push_notification
from config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)


def get_severity(conf):
    if conf > 0.9:
        return "critical"
    elif conf > 0.75:
        return "high"
    elif conf > 0.5:
        return "medium"
    return "low"


async def handle_detection(db: Session, pest_name, confidence, severity, lat, lng, user=None):
    # ── Save detection ──
    wkt_point = f"SRID=4326;POINT({lng} {lat})"

    detection = PestDetection(
        user_id=user.id if user else None,
        pest_name=pest_name,
        confidence=confidence,
        severity=severity or get_severity(confidence),
        latitude=lat,
        longitude=lng,
        location=wkt_point,
        alert_sent=False,
        alert_count=0,
    )

    db.add(detection)
    db.flush()

    # ── Find nearby users ──
    radius_m = settings.ALERT_RADIUS_METERS

    nearby_query = text("""
        SELECT u.id
        FROM users u
        JOIN push_subscriptions ps ON ps.user_id = u.id
        WHERE 
            u.location IS NOT NULL
            AND u.is_active = true
            AND (:reporter_id IS NULL OR u.id != :reporter_id)
            AND ST_DWithin(
                u.location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
        LIMIT 500
    """)

    result = db.execute(nearby_query, {
        "lat": lat,
        "lng": lng,
        "radius": radius_m,
        "reporter_id": user.id if user else None,
    })

    user_ids = [str(row.id) for row in result.fetchall()]
    farmers_alerted = len(user_ids)

    # ── Push notifications (ASYNC SAFE) ──
    if user_ids:
        subs = db.query(PushSubscription).filter(
            PushSubscription.user_id.in_(user_ids)
        ).all()

        tasks = []
        for sub in subs:
            tasks.append(
                send_push_notification(
                    endpoint=sub.endpoint,
                    p256dh=sub.p256dh_key,
                    auth=sub.auth_key,
                    payload={
                        "title": "⚠️ AgriShield Alert",
                        "body": f"{pest_name} detected nearby!",
                    }
                )
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, Exception):
                logger.warning(f"Push failed: {r}")

        detection.alert_sent = True
        detection.alert_count = farmers_alerted

    db.commit()
    db.refresh(detection)

    return {
        "detection_id": str(detection.id),
        "farmers_alerted": farmers_alerted
    }