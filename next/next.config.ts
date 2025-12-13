import type { NextConfig } from "next";

// API 配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://anon.localhost:8080'
// 是否使用代理
// true 使用代理 /apiService
// false 直接请求后端
const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY !== 'false' // 默认使用代理

const nextConfig: NextConfig = {
  // 重写配置（用于代理）
  async rewrites() {
    if (USE_PROXY) {
      return [
        {
          source: '/apiService/:path*',
          destination: `${API_BASE_URL}/:path*`,
        },
      ]
    }
    return []
  },
};

export default nextConfig;
