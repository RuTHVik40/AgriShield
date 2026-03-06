/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'agrishield-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/model\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tf-model-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 604800 },
      },
    },
    {
      urlPattern: /\/api\/community\/feed/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'community-feed-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },

  images: {
    domains: ['localhost', 'agrishield.app'],
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
};

module.exports = withPWA(nextConfig);