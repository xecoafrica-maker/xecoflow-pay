// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://xecoflow-2gen.onrender.com/v1/:path*',
      },
      {
        source: '/v1/:path*',
        destination: 'https://xecoflow-2gen.onrender.com/v1/:path*',
      },
    ]
  },

  // ✅ ADD CSP HEADERS TO ALLOW WEBSOCKET
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self'",
              "https://*.supabase.co",
              "https://*.onrender.com",
              "wss://*.onrender.com",
              "ws://*.onrender.com",
              "https://api.ipify.org",
              "https://api.my-ip.io",
              "https://ipapi.co"
            ].join(' ')
          }
        ]
      }
    ];
  },

  // ✅ REMOVE console.log / info / debug IN PRODUCTION
  // Keeps console.error and console.warn so real issues still surface.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
};

export default nextConfig;