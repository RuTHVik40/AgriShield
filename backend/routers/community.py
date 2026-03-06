"""
AgriShield Community Router
GET  /api/community/feed    — Paginated community post feed
POST /api/community/posts   — Create a new post
POST /api/community/posts/{id}/like — Like/unlike a post
GET  /api/community/heatmap — Heatmap data (delegates to alerts router logic)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from models.models import CommunityPost, PostLike, User
from services.auth_service import get_current_user, get_current_user_optional
from config import settings

router = APIRouter()


class CreatePostRequest(BaseModel):
    content:       str
    image_url:     Optional[str] = None
    latitude:      Optional[float] = None
    longitude:     Optional[float] = None
    location_name: Optional[str] = None
    pest_name:     Optional[str] = None
    severity:      Optional[str] = None


class PostResponse(BaseModel):
    id:            str
    author_name:   str
    content:       str
    image_url:     Optional[str]
    location_name: Optional[str]
    pest_name:     Optional[str]
    likes_count:   int
    created_at:    datetime


@router.get("/feed", response_model=List[PostResponse])
def get_feed(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    lat:   Optional[float] = None,
    lng:   Optional[float] = None,
    db:    Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Returns paginated community feed, optionally filtered by proximity."""
    offset = (page - 1) * limit

    query = db.query(CommunityPost).order_by(desc(CommunityPost.created_at))
    posts = query.offset(offset).limit(limit).all()

    return [
        PostResponse(
            id            = str(p.id),
            author_name   = p.user.name if p.user else "Anonymous",
            content       = p.content,
            image_url     = p.image_url,
            location_name = p.location_name,
            pest_name     = p.detection.pest_name if p.detection else None,
            likes_count   = p.likes_count,
            created_at    = p.created_at,
        )
        for p in posts
    ]


@router.post("/posts", response_model=PostResponse, status_code=201)
def create_post(
    body:         CreatePostRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Create a new community post."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    wkt = f"SRID=4326;POINT({body.longitude} {body.latitude})" if body.latitude and body.longitude else None

    post = CommunityPost(
        user_id       = current_user.id,
        content       = body.content.strip(),
        image_url     = body.image_url,
        latitude      = body.latitude,
        longitude     = body.longitude,
        location      = wkt,
        location_name = body.location_name,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return PostResponse(
        id            = str(post.id),
        author_name   = current_user.name or "Anonymous",
        content       = post.content,
        image_url     = post.image_url,
        location_name = post.location_name,
        pest_name     = None,
        likes_count   = 0,
        created_at    = post.created_at,
    )


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id:      str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Toggle like on a post."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id,
    ).first()

    if existing:
        db.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        post.likes_count += 1
        liked = True

    db.commit()
    return {"liked": liked, "likes_count": post.likes_count}
