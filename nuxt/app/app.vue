<script setup lang="ts">
import { useAuthStore } from '~/composables/useAuthStore'
import { useAuth } from '~/composables/useAuth'
import { useUserManager, authApi } from '~/composables/useApiService'
import { apiService } from '~/composables/api/core'
import { getStoredToken } from '~/composables/utils/storage'
import { useCaptcha } from '~/composables/api/captcha'
import type { LoginCredentials } from '~/composables/api/types'

const authStore = useAuthStore()
const { login, checkLoginStatus } = useAuth()
const { captchaImage, autoInit, refreshCaptcha, isLoading: captchaLoading } = useCaptcha()

const form = reactive<LoginCredentials>({
  username: '',
  password: '',
  rememberMe: false,
  captcha: ''
})

const loading = ref(false)
const error = ref('')
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.user)
const responseJson = ref<string | null>(null)
const fetchingUserInfo = ref(false)

onMounted(async () => {
  if (!import.meta.client) return

  try {
    await apiService.initConfig()

    const token = getStoredToken()
    if (token) {
      apiService.setToken(token)
    }

    await authStore.checkAuthStatus()
    
    // 如果启用验证码，自动初始化
    if (apiService.isCaptchaEnabled()) {
      await autoInit()
    }
  } catch (err) {
    console.error('应用初始化失败:', err)
  }
})

const handleLogin = async () => {
  error.value = ''

  // 基本验证
  if (!form.username.trim() || !form.password) {
    error.value = '用户名和密码不能为空'
    return
  }

  loading.value = true

  try {
    const loginData: LoginCredentials = {
      username: form.username,
      password: form.password,
      rememberMe: form.rememberMe,
      ...(apiService.isCaptchaEnabled() ? { captcha: form.captcha } : {})
    }
    const result = await login(loginData)

    if (result.success && result.data) {
      // 登录成功，先设置用户信息
      authStore.setUser(result.data)

      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        const { getUserInfo } = useUserManager()
        const userInfoResult = await getUserInfo()
        if (userInfoResult.success && userInfoResult.logged_in && userInfoResult.data) {
          authStore.setUser(userInfoResult.data)
        }
      } catch (err) {
        console.warn('获取用户信息失败，使用登录返回的数据:', err)
      }

      authStore.initialized = true
      error.value = ''
      // 登录成功后刷新验证码
      if (apiService.isCaptchaEnabled()) {
        form.captcha = ''
        await refreshCaptcha()
      }
    } else {
      error.value = result.message || '登录失败'
      // 如果是验证码错误，自动刷新验证码
      if (apiService.isCaptchaEnabled()) {
        const errorMsg = result.message || ''
        if (errorMsg.includes('验证码') || errorMsg.includes('captcha')) {
          form.captcha = ''
          await refreshCaptcha()
        }
      }
    }
  } catch (err) {
    console.error('登录请求失败:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    error.value = errorMessage.includes('验证码') || errorMessage.includes('captcha') 
      ? errorMessage 
      : '网络错误，请稍后再试'
    // 如果是验证码错误，自动刷新验证码
    if (apiService.isCaptchaEnabled()) {
      if (errorMessage.includes('验证码') || errorMessage.includes('captcha')) {
        form.captcha = ''
        await refreshCaptcha()
      }
    }
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    error.value = ''
  } catch (err) {
    console.error('登出失败:', err)
    error.value = '登出失败'
  }
}

const handleCheckStatus = async () => {
  try {
    await checkLoginStatus(true)
    if (authStore) {
      await authStore.checkAuthStatus(true)
    }
  } catch (err) {
    console.error('检查状态失败:', err)
  }
}

const handleGetUserInfo = async () => {
  error.value = ''
  responseJson.value = null
  fetchingUserInfo.value = true

  try {
    const { apiService } = await import('~/composables/api/core')
    const { API_ENDPOINTS, API_CONFIG } = await import('~/composables/api/config')

    const baseUrl = API_CONFIG.baseUrl
    const url = `${baseUrl}${API_ENDPOINTS.USER.INFO}`

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(apiService.getToken() ? { 'X-API-Token': apiService.getToken()! } : {})
      }
    })

    const jsonData = await response.json()
    responseJson.value = JSON.stringify(jsonData, null, 2)

    const { getUserInfo } = useUserManager()
    await getUserInfo(true)
  } catch (err) {
    console.error('获取用户信息失败:', err)
    error.value = '获取用户信息失败'
    responseJson.value = JSON.stringify({ error: err instanceof Error ? err.message : '获取用户信息失败' }, null, 2)
  } finally {
    fetchingUserInfo.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <div class="app-content">
      <div class="card">
        <h1 class="card-title">Nuxt 4 登录测试</h1>

        <div class="status-box" :class="{ 'status-success': isLoggedIn, 'status-info': !isLoggedIn }">
          <p class="status-text">
            <span class="status-label">登录状态:</span>
            <span :class="isLoggedIn ? 'status-value success' : 'status-value error'">
              {{ isLoggedIn ? '已登录' : '未登录' }}
            </span>
          </p>
          <div v-if="currentUser" class="user-info">
            <p class="user-item">
              <span class="user-label">用户名:</span> {{ currentUser.username }}
            </p>
            <p class="user-item">
              <span class="user-label">邮箱:</span> {{ currentUser.email }}
            </p>
            <p class="user-item">
              <span class="user-label">用户组:</span> {{ currentUser.group || 'user' }}
            </p>
          </div>
        </div>
        <div v-if="!isLoggedIn" class="form-container">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="form.username" type="text" placeholder="请输入用户名" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="form.password" type="password" placeholder="请输入密码" class="form-input" />
          </div>

          <div v-if="apiService.isCaptchaEnabled()" class="form-group">
            <label class="form-label">验证码</label>
            <div class="captcha-container">
              <input 
                v-model="form.captcha" 
                type="text" 
                placeholder="请输入验证码" 
                class="form-input captcha-input"
                required
              />
              <div class="captcha-image-wrapper" @click="refreshCaptcha">
                <img 
                  v-if="captchaImage" 
                  :src="captchaImage" 
                  alt="验证码" 
                  class="captcha-image"
                  :style="{ cursor: 'pointer', opacity: captchaLoading ? 0.5 : 1 }"
                />
                <div v-else class="captcha-placeholder">加载中...</div>
              </div>
            </div>
          </div>

          <div class="form-checkbox-group">
            <input id="rememberMe" v-model="form.rememberMe" type="checkbox" class="form-checkbox" />
            <label for="rememberMe" class="form-checkbox-label">
              记住我
            </label>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button @click="handleLogin" :disabled="loading" class="btn btn-primary" :class="{ 'btn-loading': loading }">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>

        <div v-else class="logged-in-container">
          <div class="success-message">
            您已成功登录！
          </div>

          <div class="user-info-card">
            <h3 class="card-subtitle">用户信息请求</h3>
            <div v-if="responseJson" class="json-display">
              <pre class="json-content">{{ responseJson }}</pre>
            </div>
            <p v-else class="json-placeholder">点击按钮获取用户信息</p>
            <button @click="handleGetUserInfo" :disabled="fetchingUserInfo || loading" class="btn btn-primary"
              :class="{ 'btn-loading': fetchingUserInfo }">
              <span v-if="fetchingUserInfo" class="spinner"></span>
              {{ fetchingUserInfo ? '请求中...' : '请求用户信息' }}
            </button>
          </div>

          <div class="button-group">
            <button @click="handleCheckStatus" class="btn btn-secondary">
              检查状态
            </button>
            <button @click="handleLogout" class="btn btn-danger">
              登出
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  padding: 2rem 1rem;
}

.app-content {
  max-width: 42rem;
  margin: 0 auto;
}

.card {
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
}

.card-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.status-box {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.status-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.status-success {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.status-text {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.status-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.status-value {
  font-weight: 600;
}

.status-value.success {
  color: #059669;
}

.status-value.error {
  color: #dc2626;
}

.user-info {
  margin-top: 0.75rem;
}

.user-item {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.25rem;
}

.user-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-checkbox-group {
  display: flex;
  align-items: center;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  cursor: pointer;
}

.form-checkbox-label {
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: #ffffff;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: #ffffff;
  flex: 1;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
  flex: 1;
}

.btn-danger:hover {
  background: #dc2626;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.success-message {
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.5rem;
  color: #059669;
  text-align: center;
  font-weight: 500;
}

.logged-in-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.user-info-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.json-display {
  background: #ffffff;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
}

.json-content {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #1f2937;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-placeholder {
  color: #9ca3af;
  font-style: italic;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.captcha-input {
  flex: 1;
}

.captcha-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
}

.captcha-image-wrapper:hover {
  border-color: #3b82f6;
  background: #f3f4f6;
}

.captcha-image {
  max-width: 120px;
  max-height: 40px;
  border-radius: 0.5rem;
}

.captcha-placeholder {
  color: #9ca3af;
  font-size: 0.75rem;
}

@media (max-width: 640px) {
  .app-container {
    padding: 1rem 0.5rem;
  }

  .card {
    padding: 1.5rem;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .code-value {
    font-size: 1.5rem;
  }
}
</style>
