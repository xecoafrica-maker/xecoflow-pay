// next.config.ts
import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const BACKEND_URL = isProduction
  ? "https://xecoflow-2gen.onrender.com"
  : "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only the /v1/* passthrough remains. This is used by legacy
    // dashboard code that calls the ledger and payment routes
    // directly (e.g. /v1/ledger/accounts/...).
    //
    // The /api/* rewrite has been removed. All /api/* calls are now
    // handled by the BFF route handlers under src/app/api/*, which
    // resolve the merchant session and forward to the correct
    // backend path.
    return [
      {
        source: "/v1/:path*",
        destination: `${BACKEND_URL}/v1/:path*`,
      },
    ];
  },

  async headers() {
    const scriptSrc = isProduction
      ? "'self'"
      : "'self' 'unsafe-eval' 'unsafe-inline'";

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co https://*.onrender.com wss://*.onrender.com ws://*.onrender.com https://api.ipify.org https://api.my-ip.io https://ipapi.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join(" "),
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-api-key" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;