"""
AgriShield Push Notification Service
"""

import json
import logging
import asyncio
from pywebpush import webpush, WebPushException

from config import settings

logger = logging.getLogger(__name__)


class SubscriptionExpiredError(Exception):
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        super().__init__(f"Subscription expired: {endpoint[:60]}")


async def send_push_notification(endpoint, p256dh, auth, payload):
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not set — skipping push")
        return False

    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh,
            "auth": auth,
        },
    }

    def send():
        return webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": f"mailto:{settings.VAPID_EMAIL}",
            },
            ttl=86400,
            content_encoding="aesgcm",
        )

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, send)

        logger.debug(f"Push sent: {response.status_code}")
        return True

    except WebPushException as e:
        status_code = e.response.status_code if e.response else None

        if status_code == 410:
            logger.info(f"Subscription expired: {endpoint[:50]}")
            raise SubscriptionExpiredError(endpoint)

        elif status_code == 429:
            logger.warning("Rate limited")

        else:
            logger.error(f"Push error {status_code}: {e}")

        raise