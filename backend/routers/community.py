from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import shutil

from database import get_db
from models.models import CommunityPost, PostLike, User, PostComment
from services.auth_service import get_current_user, get_current_user_optional
from dotenv import load_dotenv
load_dotenv()
# ─────────────────────────────────────────────────────────────
# CLOUDINARY SETUP
# ─────────────────────────────────────────────────────────────
import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True
)
router = APIRouter()

# ─────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────
class CreatePostRequest(BaseModel):
    content: str
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None


class PostResponse(BaseModel):
    id: str
    author_name: str
    content: str
    image_url: Optional[str]
    location_name: Optional[str]
    pest_name: Optional[str]
    likes_count: int
    comments_count: int
    liked_by_user: bool
    created_at: datetime


class CreateCommentRequest(BaseModel):
    content: str


# ─────────────────────────────────────────────────────────────
# IMAGE UPLOAD (CLOUDINARY)
# ─────────────────────────────────────────────────────────────
@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    print("CLOUD:", os.getenv("CLOUDINARY_CLOUD_NAME"))
    print("KEY:", os.getenv("CLOUDINARY_API_KEY"))
    print("SECRET:", os.getenv("CLOUDINARY_API_SECRET"))

    try:

        result = cloudinary.uploader.upload(
            file.file,
            folder="agrishield_posts",   # optional folder
            transformation=[
        {"width": 800, "height": 800, "crop": "limit"},
        {"quality": "auto"},
        {"fetch_format": "auto"}
    ],
            resource_type="image"
        )

        return {
            "url": result["secure_url"]
        }

    except Exception as e:
        print("IMAGE UPLOAD ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# GET FEED
# ─────────────────────────────────────────────────────────────
@router.get("/feed", response_model=List[PostResponse])
def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    offset = (page - 1) * limit

    query = db.query(CommunityPost)\
        .options(
            joinedload(CommunityPost.user),
            joinedload(CommunityPost.detection),
            joinedload(CommunityPost.comments),
            joinedload(CommunityPost.likes)
        )\
        .order_by(desc(CommunityPost.created_at))

    posts = query.offset(offset).limit(limit).all()

    result = []

    for p in posts:
        liked_by_user = False

        if current_user:
            liked_by_user = any(
                like.user_id == current_user.id for like in p.likes
            )

        result.append(
            PostResponse(
                id=str(p.id),
                author_name=p.user.name if p.user else "Anonymous",
                content=p.content,
                image_url=p.image_url,
                location_name=p.location_name,
                pest_name=p.detection.pest_name if p.detection else None,
                likes_count=p.likes_count,
                comments_count=len(p.comments),
                liked_by_user=liked_by_user,
                created_at=p.created_at,
            )
        )

    return result


# ─────────────────────────────────────────────────────────────
# CREATE POST
# ─────────────────────────────────────────────────────────────
@router.post("/posts", response_model=PostResponse, status_code=201)
def create_post(
    body: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    wkt = (
        f"SRID=4326;POINT({body.longitude} {body.latitude})"
        if body.latitude is not None and body.longitude is not None
        else None
    )

    post = CommunityPost(
        user_id=current_user.id,
        content=body.content.strip(),
        image_url=body.image_url,
        latitude=body.latitude,
        longitude=body.longitude,
        location=wkt,
        location_name=body.location_name,
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return PostResponse(
        id=str(post.id),
        author_name=current_user.name or "Anonymous",
        content=post.content,
        image_url=post.image_url,
        location_name=post.location_name,
        pest_name=None,
        likes_count=0,
        comments_count=0,
        liked_by_user=False,
        created_at=post.created_at,
    )


# ─────────────────────────────────────────────────────────────
# LIKE / UNLIKE
# ─────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


# ─────────────────────────────────────────────────────────────
# COMMENTS
# ─────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/comments")
def add_comment(
    post_id: str,
    body: CreateCommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=body.content.strip()
    )

    db.add(comment)
    db.commit()

    return {"message": "Comment added"}


@router.get("/posts/{post_id}/comments")
def get_comments(post_id: str, db: Session = Depends(get_db)):
    comments = db.query(PostComment)\
        .options(joinedload(PostComment.user))\
        .filter(PostComment.post_id == post_id)\
        .order_by(PostComment.created_at.desc())\
        .all()

    return [
        {
            "id": str(c.id),
            "author": c.user.name,
            "content": c.content,
            "created_at": c.created_at,
        }
        for c in comments
    ]