/**
 * AgriShield Push Notification Manager
 * 
 * Handles:
 * - Service worker registration
 * - Push subscription creation (VAPID)
 * - Sending subscription to backend
 * - Requesting notification permission
 */

import { subscriptionsApi } from './apiClient';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID base64 key to Uint8Array for browser Push API
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications.
 * Call this after user sign-in and location permission.
 */
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push notifications not supported in this browser');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set');
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Send to backend
    const { keys } = subscription.toJSON();
    await subscriptionsApi.subscribe({
      endpoint: subscription.endpoint,
      p256dh:   keys.p256dh,
      auth:     keys.auth,
    });

    console.log('[Push] Subscribed to push notifications ✅');
    return true;

  } catch (err) {
    console.error('[Push] Subscription error:', err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscriptionsApi.unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed ✅');
    }
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
  }
}

/**
 * Show a local notification (no server required).
 * Used for instant feedback after a scan.
 */
export async function showLocalNotification(title, body, data = {}) {
  if (!('serviceWorker' in navigator)) return;
  
  const registration = await navigator.serviceWorker.ready;
  registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data,
    tag:   'agrishield-scan',
    renotify: true,
  });
}
