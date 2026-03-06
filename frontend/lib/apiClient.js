import axios from 'axios';
import { getSession } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Request failed';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

// Typed API helpers
export const alertsApi = {
  pestDetected: (data) => apiClient.post('/api/alerts/pest-detected', data),
  getNearby:    (lat, lng, radius = 5000) =>
    apiClient.get('/api/alerts/nearby', { params: { lat, lng, radius } }),
};

export const communityApi = {
  getFeed:   (page = 1)          => apiClient.get('/api/community/feed', { params: { page } }),
  createPost: (data)              => apiClient.post('/api/community/posts', data),
  getHeatmap: (lat, lng, radius) => apiClient.get('/api/community/heatmap', { params: { lat, lng, radius } }),
  likePost:   (postId)            => apiClient.post(`/api/community/posts/${postId}/like`),
};

export const authApi = {
  sendOtp:  (phone)       => apiClient.post('/api/auth/otp/send', { phone }),
  verifyOtp: (phone, otp) => apiClient.post('/api/auth/otp/verify', { phone, otp }),
};

export const subscriptionsApi = {
  subscribe:   (subscription) => apiClient.post('/api/push/subscribe', subscription),
  unsubscribe: (endpoint)     => apiClient.post('/api/push/unsubscribe', { endpoint }),
};
