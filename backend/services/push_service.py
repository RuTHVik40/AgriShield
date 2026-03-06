"""
AgriShield Push Notification Service
=====================================
Sends Web Push API notifications using pywebpush + VAPID keys.
"""

import json
import logging
from typing import Optional
from pywebpush import webpush, WebPushException

from config import settings

logger = logging.getLogger(__name__)


async def send_push_notification(
    endpoint: str,
    p256dh:   str,
    auth:     str,
    payload:  dict,
) -> bool:
    """
    Send a Web Push notification to a single subscription.
    
    Args:
        endpoint: Browser push endpoint URL
        p256dh:   ECDH public key from browser subscription
        auth:     Auth secret from browser subscription  
        payload:  Notification data dict (title, body, etc.)
    
    Returns:
        True if successful, raises exception on failure.
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured — skipping push notification")
        return False

    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh,
            "auth":   auth,
        },
    }

    try:
        response = webpush(
            subscription_info  = subscription_info,
            data               = json.dumps(payload),
            vapid_private_key  = settings.VAPID_PRIVATE_KEY,
            vapid_claims       = {
                "sub": f"mailto:{settings.VAPID_EMAIL}",
            },
            ttl                = 86400,  # 24 hours
            content_encoding   = "aesgcm",
        )
        logger.debug(f"Push sent: {response.status_code}")
        return True

    except WebPushException as e:
        status_code = e.response.status_code if e.response else None
        if status_code == 410:
            # Subscription expired — caller should delete it from DB
            logger.info(f"Subscription expired (410): {endpoint[:50]}")
            raise SubscriptionExpiredError(endpoint)
        elif status_code == 429:
            logger.warning(f"Push rate limited (429): {endpoint[:50]}")
        else:
            logger.error(f"WebPush error {status_code}: {e}")
        raise


class SubscriptionExpiredError(Exception):
    """Raised when a push subscription returns 410 Gone."""
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        super().__init__(f"Subscription expired: {endpoint[:60]}")
