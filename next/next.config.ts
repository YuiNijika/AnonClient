import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DEV_BASE_URL: '/anon-dev-server',
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
  async rewrites() {
    return [
      {
        source: '/anon-dev-server/:path*',
        destination: 'http://anon.localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
