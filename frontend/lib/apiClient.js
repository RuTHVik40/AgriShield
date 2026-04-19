import axios from 'axios';
import { getSession } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});


apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();

    console.log("SESSION TOKEN:", session?.accessToken);

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  return config;
});
// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Request failed';

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// ── APIs ─────────────────────────────

export const mlApi = {
  predict: (file, lat, lng) => {
  const formData = new FormData();
  formData.append('file', file);

  if (lat && lng) {
    formData.append('lat', lat);   // ✅ ADD
    formData.append('lng', lng);   // ✅ ADD
  }

  return apiClient.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
};

export const alertsApi = {
  pestDetected: (data) =>
    apiClient.post('/api/alerts/pest-detected', data),

  getNearby: (lat, lng, radius = 5000) =>
    apiClient.get('/api/alerts/nearby', {
      params: { lat, lng, radius },
    }),

  // ✅ ADD THIS
  getHeatmap: (lat, lng, radius = 50000) =>
    apiClient.get('/api/alerts/heatmap', {
      params: { lat, lng, radius },
    }),
};

export const communityApi = {
  getFeed: (page = 1) =>
    apiClient.get('/api/community/feed', { params: { page } }),

  createPost: (data) =>
    apiClient.post('/api/community/posts', {
      content: data.content,
      image_url: data.image_url,
      latitude: data.latitude,
      longitude: data.longitude,
      location_name: data.location_name,
    }),

  likePost: (postId) =>
    apiClient.post(`/api/community/posts/${postId}/like`),

  // ✅ NEW
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post("/api/community/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ NEW
  getComments: (postId) =>
    apiClient.get(`/api/community/posts/${postId}/comments`),

  // ✅ NEW
  addComment: (postId, content) =>
    apiClient.post(`/api/community/posts/${postId}/comments`, {
      content,
    }),
};

export const authApi = {
  sendOtp: (phone) =>
    apiClient.post('/api/auth/otp/send', { phone }),

  verifyOtp: (phone, otp) =>
    apiClient.post('/api/auth/otp/verify', { phone, otp }),
};

export const subscriptionsApi = {
  subscribe: (subscription) =>
    apiClient.post('/api/push/subscribe', subscription),

  unsubscribe: (endpoint) =>
    apiClient.post('/api/push/unsubscribe', { endpoint }),
};