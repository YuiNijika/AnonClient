// https://nuxt.com/docs/api/configuration/nuxt-config

const apiBaseUrls = [
  'http://anon.localhost:8080',
  '/anon-dev-server'
]

// 通过修改索引切换地址
const apiBaseUrl = apiBaseUrls[1]

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: apiBaseUrl,
      apiBackendUrl: apiBaseUrls[0], // 代理的目标后端
    }
  },

  vite: {
    server: {
      proxy: {
        '/anon-dev-server': {
          target: apiBaseUrls[0],
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anon-dev-server/, ''),
        },
      },
    },
  },
})
