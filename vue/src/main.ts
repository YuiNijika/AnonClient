import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { apiService } from './api/core'
import { getStoredToken } from './utils/storage'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化 API 配置和 Token
async function initApp() {
  try {
    // 初始化配置
    await apiService.initConfig()
    
    // 如果已保存 Token，加载到 API 服务
    const token = getStoredToken()
    if (token) {
      apiService.setToken(token)
    }
  } catch (error) {
    console.error('应用初始化失败:', error)
  } finally {
    app.mount('#app')
  }
}

initApp()
