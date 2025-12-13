// https://nuxt.com/docs/api/configuration/nuxt-config

// API 配置
const API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://anon.localhost:8080'
// 是否使用代理
// true 使用代理 /apiService
// false 直接请求后端
const USE_PROXY = process.env.NUXT_USE_PROXY !== 'false' // 默认使用代理

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  build: {
    transpile: [
      'vueuse'
    ],
  },
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate'
  ],
  // 运行时配置
  runtimeConfig: {
    public: {
      apiBaseUrl: USE_PROXY ? '/apiService' : API_BASE_URL,
      // 后端地址
      apiBackendUrl: API_BASE_URL,
      // 是否使用代理
      useProxy: USE_PROXY
    }
  },
  // Nitro 代理配置
  // 仅在 USE_PROXY=true 时生效
  ...(USE_PROXY && {
    nitro: {
      devProxy: {
        '/apiService': {
          target: API_BASE_URL,
          changeOrigin: true,
          prependPath: true
        }
      }
    }
  })
})