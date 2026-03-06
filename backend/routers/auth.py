"""
AgriShield Authentication Router
=================================
POST /api/auth/otp/send    — Send OTP to phone number via Twilio
POST /api/auth/otp/verify  — Verify OTP, return JWT access token
POST /api/auth/google      — Exchange Google ID token for app JWT
"""

import random
import string
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import jwt
import bcrypt

from database import get_db
from models.models import User, OTPRecord
from config import settings

router = APIRouter()


# ── JWT helpers ────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── OTP helpers ────────────────────────────────────────────────────────────────

def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def hash_otp(otp: str) -> str:
    return bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()


def verify_otp_hash(otp: str, hashed: str) -> bool:
    return bcrypt.checkpw(otp.encode(), hashed.encode())


def send_otp_via_twilio(phone: str, otp: str):
    """Send OTP SMS via Twilio. Skip gracefully if not configured."""
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        # Development mode — log OTP instead
        import logging
        logging.getLogger(__name__).warning(f"[DEV] OTP for {phone}: {otp}")
        return True

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body  = f"Your AgriShield OTP is: {otp}. Valid for 10 minutes.",
            from_ = settings.TWILIO_PHONE_NUMBER,
            to    = phone,
        )
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")


# ── Schemas ────────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    phone: str  # e.g., "+919876543210"

class VerifyOTPRequest(BaseModel):
    phone: str
    otp:   str

class GoogleAuthRequest(BaseModel):
    google_id_token: str
    name:  Optional[str] = None
    email: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: dict


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/otp/send")
def send_otp(body: SendOTPRequest, db: Session = Depends(get_db)):
    """Generate OTP, store hashed version, send via Twilio."""
    phone = body.phone.strip()
    if not phone.startswith('+') or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Phone must be in E.164 format (+CCNUMBER)")

    otp = generate_otp()
    otp_hash = hash_otp(otp)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Invalidate existing OTPs for this phone
    db.query(OTPRecord).filter(
        OTPRecord.phone == phone,
        OTPRecord.used == False
    ).update({"used": True})

    # Store new OTP
    record = OTPRecord(phone=phone, otp_hash=otp_hash, expires_at=expires_at)
    db.add(record)
    db.commit()

    send_otp_via_twilio(phone, otp)

    return {"message": "OTP sent successfully", "phone": phone}


@router.post("/otp/verify", response_model=AuthResponse)
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP, create/find user, return JWT."""
    phone = body.phone.strip()
    now   = datetime.now(timezone.utc)

    # Get the latest unused OTP for this phone
    record = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.phone == phone,
            OTPRecord.used == False,
            OTPRecord.expires_at > now,
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found or expired. Request a new one.")

    if not verify_otp_hash(body.otp, record.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # Mark OTP as used
    record.used = True
    db.commit()

    # Find or create user
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(phone=phone, name=f"Farmer {phone[-4:]}")
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))

    return AuthResponse(
        access_token = token,
        user = {
            "id":    str(user.id),
            "name":  user.name,
            "phone": user.phone,
            "email": user.email,
        }
    )


@router.post("/google", response_model=AuthResponse)
def google_auth(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Verify Google ID token and return app JWT.
    In production, verify the token with Google's API.
    """
    # TODO: Verify the Google ID token using google-auth library
    # from google.oauth2 import id_token
    # from google.auth.transport import requests
    # idinfo = id_token.verify_oauth2_token(body.google_id_token, requests.Request(), GOOGLE_CLIENT_ID)

    if not body.email:
        raise HTTPException(status_code=400, detail="Email required from Google auth")

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        user = User(
            email     = body.email,
            name      = body.name or body.email.split('@')[0],
            google_id = body.google_id_token[:100],  # Store truncated for reference
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(
        access_token = token,
        user = {"id": str(user.id), "name": user.name, "email": user.email}
    )
