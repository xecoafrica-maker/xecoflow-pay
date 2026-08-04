import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://xecoflow-2gen.onrender.com/v1/:path*',
      },
    ]
  },
};

export default nextConfig;