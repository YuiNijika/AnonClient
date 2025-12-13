import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// API 配置
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://anon.localhost:8080'
// 是否使用代理
// true 使用代理 /apiService
// false 直接请求后端
const USE_PROXY = process.env.VITE_USE_PROXY !== 'false' // 默认使用代理

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // 开发服务器配置
  server: {
    proxy: USE_PROXY
      ? {
          '/apiService': {
            target: API_BASE_URL,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/apiService/, ''),
          },
        }
      : undefined,
  },
});
