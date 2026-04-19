"""
AgriShield Database Models
PostGIS geometry used for geospatial proximity queries
"""

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text,
    DateTime, ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid
import datetime
from database import Base


# ─────────────────────────────────────────────────────────────
# USER MODEL
# ─────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(100))
    email      = Column(String(200), unique=True, nullable=True, index=True)
    phone      = Column(String(20),  unique=True, nullable=True, index=True)
    google_id  = Column(String(100), unique=True, nullable=True)
    avatar_url = Column(Text, nullable=True)
    farm_name  = Column(String(200), nullable=True)
    password = Column(String, nullable=True)
    # Location
    latitude   = Column(Float, nullable=True)
    longitude  = Column(Float, nullable=True)
    location   = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    push_subscriptions = relationship(
        "PushSubscription", back_populates="user", cascade="all, delete-orphan"
    )
    pest_detections = relationship(
        "PestDetection", back_populates="user"
    )
    community_posts = relationship(
        "CommunityPost", back_populates="user"
    )

    __table_args__ = (
        Index("idx_user_location", "location", postgresql_using="gist"),
    )


# ─────────────────────────────────────────────────────────────
# PUSH SUBSCRIPTIONS
# ─────────────────────────────────────────────────────────────
class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    endpoint   = Column(Text, unique=True, nullable=False, index=True)
    p256dh_key = Column(Text, nullable=False)
    auth_key   = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="push_subscriptions")


# ─────────────────────────────────────────────────────────────
# PEST DETECTIONS (CORE MODEL)
# ─────────────────────────────────────────────────────────────
class PestDetection(Base):
    __tablename__ = "pest_detections"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    pest_name  = Column(String(200), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    severity   = Column(String(20), nullable=False)

    # Geo
    latitude   = Column(Float, nullable=False)
    longitude  = Column(Float, nullable=False)
    location   = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    # Alerts
    alert_sent  = Column(Boolean, default=False)
    alert_count = Column(Integer, default=0)

    # ML Data
    raw_predictions = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="pest_detections")

    __table_args__ = (
        Index("idx_detection_location", "location", postgresql_using="gist"),
    )


# ─────────────────────────────────────────────────────────────
# COMMUNITY POSTS
# ─────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────
# COMMUNITY POSTS
# ─────────────────────────────────────────────────────────────
class CommunityPost(Base):
    __tablename__ = "community_posts"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    detection_id = Column(UUID(as_uuid=True), ForeignKey("pest_detections.id"), nullable=True)

    content      = Column(Text, nullable=False)
    image_url    = Column(Text, nullable=True)

    latitude      = Column(Float, nullable=True)
    longitude     = Column(Float, nullable=True)
    location      = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    location_name = Column(String(200), nullable=True)

    likes_count = Column(Integer, default=0)
    is_alert    = Column(Boolean, default=False)

    created_at  = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user      = relationship("User", back_populates="community_posts")
    detection = relationship("PestDetection")

    likes = relationship(
        "PostLike",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    # ✅ NEW (IMPORTANT)
    comments = relationship(
        "PostComment",
        backref="post",
        cascade="all, delete-orphan"
    )


# ─────────────────────────────────────────────────────────────
# POST LIKES
# ─────────────────────────────────────────────────────────────
class PostLike(Base):
    __tablename__ = "post_likes"

    id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    post = relationship("CommunityPost", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="unique_post_like"),
    )


# ─────────────────────────────────────────────────────────────
# OTP RECORDS
# ─────────────────────────────────────────────────────────────
class OTPRecord(Base):
    __tablename__ = "otp_records"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone      = Column(String(20), nullable=False, index=True)
    otp_hash   = Column(String(200), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ─────────────────────────────────────────────────────────────
# POST COMMENTS
# ─────────────────────────────────────────────────────────────
class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")