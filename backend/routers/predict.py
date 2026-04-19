from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
import logging

from services.ml_service import predict_image
from services.alerts_service import handle_detection, get_severity
from database import get_db
from services.auth_service import get_current_user_optional
from models.models import User   # ✅ IMPORTANT (missing in your code)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/")
async def predict(
    file: UploadFile = File(...),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)  # ✅ FIX HERE
):
    try:
        # ── Validate file ──
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        contents = await file.read()

        # ── 1. ML Prediction ──
        result = predict_image(contents)

        # ── 2. Auto severity ──
        severity = get_severity(result["confidence"])

        # ── 3. Trigger alerts ──
        alert_response = None

        if lat is not None and lng is not None:
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                raise HTTPException(status_code=400, detail="Invalid coordinates")

            alert_response = await handle_detection(
                db=db,
                pest_name=result["pest"],
                confidence=result["confidence"],
                severity=severity,
                lat=lat,
                lng=lng,
                user=current_user   # ✅ now works correctly
            )

        return {
            "success": True,
            "data": result,
            "severity": severity,
            "alert": alert_response
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")