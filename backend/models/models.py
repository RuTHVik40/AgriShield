"""
AgriShield Database Models
PostGIS geometry used for geospatial proximity queries
"""

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text,
    DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid

from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100))
    email         = Column(String(200), unique=True, nullable=True)
    phone         = Column(String(20),  unique=True, nullable=True)
    google_id     = Column(String(100), unique=True, nullable=True)
    avatar_url    = Column(Text, nullable=True)
    farm_name     = Column(String(200), nullable=True)

    # Last known location (updated on each scan/login)
    latitude      = Column(Float, nullable=True)
    longitude     = Column(Float, nullable=True)
    location      = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    push_subscriptions = relationship("PushSubscription", back_populates="user", cascade="all, delete-orphan")
    pest_detections    = relationship("PestDetection",    back_populates="user")
    community_posts    = relationship("CommunityPost",    back_populates="user")

    def __repr__(self):
        return f"<User {self.name or self.phone or self.email}>"


class PushSubscription(Base):
    """Stores Web Push API subscriptions for each user device."""
    __tablename__ = "push_subscriptions"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    endpoint      = Column(Text, unique=True, nullable=False)
    p256dh_key    = Column(Text, nullable=False)   # From browser subscription object
    auth_key      = Column(Text, nullable=False)   # From browser subscription object
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="push_subscriptions")


class PestDetection(Base):
    """Stores every pest scan result with geolocation."""
    __tablename__ = "pest_detections"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    pest_name     = Column(String(200), nullable=False)
    confidence    = Column(Float,       nullable=False)    # 0.0 – 1.0
    severity      = Column(String(20),  nullable=False)    # low | medium | high | critical
    
    # Geolocation
    latitude      = Column(Float,    nullable=False)
    longitude     = Column(Float,    nullable=False)
    location      = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    
    # Alert tracking
    alert_sent    = Column(Boolean, default=False)
    alert_count   = Column(Integer, default=0)   # How many farmers were alerted
    
    raw_predictions = Column(JSON, nullable=True)   # Top 5 model outputs
    
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="pest_detections")


class CommunityPost(Base):
    """Community feed post with optional pest detection link."""
    __tablename__ = "community_posts"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    detection_id  = Column(UUID(as_uuid=True), ForeignKey("pest_detections.id"), nullable=True)
    
    content       = Column(Text, nullable=False)
    image_url     = Column(Text, nullable=True)
    
    latitude      = Column(Float, nullable=True)
    longitude     = Column(Float, nullable=True)
    location      = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    location_name = Column(String(200), nullable=True)
    
    likes_count   = Column(Integer, default=0)
    is_alert      = Column(Boolean, default=False)
    
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user      = relationship("User", back_populates="community_posts")
    detection = relationship("PestDetection")
    likes     = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")


class PostLike(Base):
    __tablename__ = "post_likes"

    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id  = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"))
    user_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    post = relationship("CommunityPost", back_populates="likes")


class OTPRecord(Base):
    """Temporary OTP storage for phone auth."""
    __tablename__ = "otp_records"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone      = Column(String(20), nullable=False, index=True)
    otp_hash   = Column(String(200), nullable=False)   # bcrypt hash of OTP
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
