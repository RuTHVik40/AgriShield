"""
Auth Service — Extract current user from JWT
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
import uuid

from database import get_db
from models.models import User
from config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def decode_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return uuid.UUID(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decode_token(credentials.credentials)

    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        user_id = decode_token(credentials.credentials)
        return db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
    except Exception:
        return None