"""
AgriShield Backend Configuration
Loads all secrets from environment variables (.env)
"""

from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str

    # ── Security ─────────────────────────────────────────────
    SECRET_KEY: str = str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # ── Web Push (VAPID) ─────────────────────────────────────
    VAPID_PUBLIC_KEY: Optional[str] = None
    VAPID_PRIVATE_KEY: Optional[str] = None
    VAPID_EMAIL: str = "admin@agrishield.app"

    # ── Twilio (OTP) ─────────────────────────────────────────
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # ── App ──────────────────────────────────────────────────
    DEBUG: bool = False
    ALERT_RADIUS_METERS: int = 5000
    MAX_COMMUNITY_POSTS_PER_PAGE: int = 20



    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()