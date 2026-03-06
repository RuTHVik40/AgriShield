"""
AgriShield Backend Configuration
Load all secrets from environment variables / .env file
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── Database ───────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://agrishield:agrishield@localhost:5432/agrishield"

    # ── Security ───────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"          # ← MUST CHANGE
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30      # 30 days

    # ── Web Push (VAPID) ───────────────────────────────────────────────────────
    VAPID_PUBLIC_KEY: str = ""                            # ← REQUIRED: from `npx web-push generate-vapid-keys`
    VAPID_PRIVATE_KEY: str = ""                           # ← REQUIRED
    VAPID_EMAIL: str = "admin@agrishield.app"             # ← Your email

    # ── Twilio (OTP) ───────────────────────────────────────────────────────────
    TWILIO_ACCOUNT_SID: Optional[str] = None             # ← From twilio.com
    TWILIO_AUTH_TOKEN: Optional[str] = None              # ← From twilio.com
    TWILIO_PHONE_NUMBER: Optional[str] = None            # ← Your Twilio number e.g. +1234567890

    # ── App ────────────────────────────────────────────────────────────────────
    DEBUG: bool = False
    ALERT_RADIUS_METERS: int = 5000                      # 5km proximity radius
    MAX_COMMUNITY_POSTS_PER_PAGE: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
