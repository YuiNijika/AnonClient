import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// API 配置
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://anon.localhost:8080'
// 是否使用代理
// true 使用代理 /apiService
// false 直接请求后端
const USE_PROXY = process.env.VITE_USE_PROXY !== 'false' // 默认使用代理

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
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
})
