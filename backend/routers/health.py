from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Test DB connection + PostGIS availability
        result = db.execute(text("SELECT PostGIS_Version()")).scalar()
        return {
            "status":         "healthy",
            "database":       "connected",
            "postgis_version": result,
        }
    except Exception as e:
        return {
            "status":   "degraded",
            "database": "error",
            "detail":   str(e),
        }
