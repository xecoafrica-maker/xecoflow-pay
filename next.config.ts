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
  : "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    const rules = [
      {
        source: "/v1/:path*",
        destination: `${BACKEND_URL}/v1/:path*`,
      },
    ];

    // The /api/* rewrite is a transition shim. It forwards /api/* calls
    // to the backend because the BFF was not yet implemented. Locally,
    // we want /api/* to hit our own route handlers so we can develop
    // and test the BFF. In production, we keep the old shim until every
    // BFF route exists.
    //
    // When the migration is complete, delete this block entirely so
    // production also uses the BFF.
    if (isProduction) {
      rules.unshift({
        source: "/api/:path*",
        destination: `${BACKEND_URL}/v1/:path*`,
      });
    }

    return rules;
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
              "connect-src 'self'",
              "https://*.supabase.co",
              "https://*.onrender.com",
              "wss://*.onrender.com",
              "ws://*.onrender.com",
              "https://api.ipify.org",
              "https://api.my-ip.io",
              "https://ipapi.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join(" "),
          },
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