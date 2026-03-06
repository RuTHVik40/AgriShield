"""
AgriShield Push Subscription Router
POST /api/push/subscribe   — Register a browser push subscription
POST /api/push/unsubscribe — Remove a push subscription
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.models import PushSubscription, User
from services.auth_service import get_current_user

router = APIRouter()


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh:   str
    auth:     str


class UnsubscribeRequest(BaseModel):
    endpoint: str


@router.post("/subscribe")
def subscribe(
    body:         SubscribeRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Register or update a push subscription for the current user."""
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == body.endpoint
    ).first()

    if existing:
        existing.user_id    = current_user.id
        existing.p256dh_key = body.p256dh
        existing.auth_key   = body.auth
    else:
        sub = PushSubscription(
            user_id    = current_user.id,
            endpoint   = body.endpoint,
            p256dh_key = body.p256dh,
            auth_key   = body.auth,
        )
        db.add(sub)

    db.commit()
    return {"message": "Subscribed to push notifications"}


@router.post("/unsubscribe")
def unsubscribe(
    body:         UnsubscribeRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Remove a push subscription."""
    deleted = db.query(PushSubscription).filter(
        PushSubscription.endpoint == body.endpoint,
        PushSubscription.user_id  == current_user.id,
    ).delete()
    db.commit()

    if not deleted:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return {"message": "Unsubscribed from push notifications"}
