// next.config.ts
import type { NextConfig } from "next";

// Which environment are we building for?
// - `npm run dev`              → development
// - `npm run build` + `start`  → production
// - `next build` in CI         → production
const isProduction = process.env.NODE_ENV === "production";

// Where the backend lives in each environment.
const BACKEND_URL = isProduction
  ? "https://xecoflow-2gen.onrender.com"
  : "http://localhost:3009";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only the /v1/* passthrough remains.
    //
    // The payments dashboard uses /v1/* paths directly (e.g.
    // /v1/transactions/inflow, /v1/ledger/accounts/.../balance).
    // These are forwarded to the backend.
    //
    // The /api/* shim that used to exist here has been REMOVED.
    // It used to forward /api/* to ${BACKEND_URL}/v1/* which is the
    // wrong path for the lending BFF — the backend expects
    // /api/v1/admin/lending/* and /v1/imara/kyc/* etc. The BFF
    // route handlers under src/app/api/* now handle /api/* and
    // forward to the correct backend paths.
    return [
      {
        source: "/v1/:path*",
        destination: `${BACKEND_URL}/v1/:path*`,
      },
    ];
  },

  async headers() {
    // script-src must include 'unsafe-eval' in dev — Next.js/Turbopack
    // uses eval() for HMR, error stack traces, and module reconstruction.
    // In production, neither eval() nor inline scripts are needed; any
    // script-src that permits them effectively disables CSP as an XSS
    // defense.
    const scriptSrc = isProduction
      ? "'self'"
      : "'self' 'unsafe-eval' 'unsafe-inline'";

    return [
      {
        // Global CSP headers
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              // React and Next.js generate inline styles. 'unsafe-inline'
              // is required for style-src; this is a much narrower risk
              // than 'unsafe-inline' on script-src.
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
        // CORS for API routes — allows cross-origin calls from Taxflow Africa
        // and any other authorized frontends.
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

  // Strip console.log / info / debug in production. Keep error and warn
  // so real issues still surface in production logs.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;