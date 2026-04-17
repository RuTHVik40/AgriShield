'use client';

import { useEffect } from 'react';
import { subscribeToPushNotifications } from '@/lib/pushManager';

export default function PushInit() {
  useEffect(() => {
    subscribeToPushNotifications();
  }, []);

  return null;
}