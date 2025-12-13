<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from './api/useAuth'
import { useUser } from './api/useUser'

const { login, logout, checkLogin, isLoggedIn, isLoading, error, clearError } = useAuth()
const { getUserInfo, userInfo, clearUserInfo } = useUser()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const responseJson = ref<string | null>(null)
const fetchingUserInfo = ref(false)

const handleLogin = async () => {
  clearError()
  try {
    await login({
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })
    // 登录成功后，等待一下再获取用户信息，确保 Cookie 已设置
    // 注意：浏览器需要时间来处理 Set-Cookie 响应头
    setTimeout(async () => {
      try {
        // 先检查登录状态，确保 Cookie 已设置
        const loggedIn = await checkLogin()
        if (loggedIn) {
          // 登录状态确认后，再获取用户信息
          await getUserInfo()
        }
      } catch (err) {
        console.error('登录后获取信息失败:', err)
      }
    }, 500)
  } catch (err) {
    console.error('登录失败:', err)
  }
}

const handleLogout = async () => {
  clearError()
  try {
    await logout()
    clearUserInfo()
  } catch (err) {
    console.error('登出失败:', err)
  }
}

const handleCheckLogin = async () => {
  clearError()
  await checkLogin()
  if (isLoggedIn.value) {
    await getUserInfo()
  }
}

const handleGetUserInfo = async () => {
  clearError()
  responseJson.value = null
  fetchingUserInfo.value = true
  
  try {
    const { apiService } = await import('./api/core')
    const { API_ENDPOINTS, API_CONFIG } = await import('./api/config')
    
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
    await getUserInfo()
  } catch (err) {
    console.error('获取用户信息失败:', err)
    responseJson.value = JSON.stringify({ error: err instanceof Error ? err.message : '获取用户信息失败' }, null, 2)
  } finally {
    fetchingUserInfo.value = false
  }
}

onMounted(() => {
  checkLogin()
})
</script>

<template>
  <div class="container">
    <h1>Vue 3 API 测试</h1>
    
    <div class="card">
      <h2>登录状态</h2>
      <p>已登录: {{ isLoggedIn ? '是' : '否' }}</p>
      <p v-if="isLoading">加载中...</p>
      <p v-if="error" class="error">错误: {{ error }}</p>
    </div>

    <div v-if="!isLoggedIn" class="card">
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名:</label>
          <input v-model="username" type="text" required />
        </div>
        <div class="form-group">
          <label>密码:</label>
          <input v-model="password" type="password" required />
        </div>
        <div class="form-group">
          <label>
            <input v-model="rememberMe" type="checkbox" />
            记住我
          </label>
        </div>
        <button type="submit" :disabled="isLoading">登录</button>
      </form>
    </div>

    <div v-if="isLoggedIn" class="card">
      <h2>用户信息</h2>
      <div v-if="responseJson" class="json-display">
        <pre class="json-content">{{ responseJson }}</pre>
      </div>
      <p v-else class="json-placeholder">点击按钮获取用户信息</p>
      <button @click="handleGetUserInfo" :disabled="fetchingUserInfo || isLoading">
        {{ fetchingUserInfo ? '请求中...' : '请求用户信息' }}
      </button>
    </div>

    <div class="card">
      <h2>操作</h2>
      <div class="button-group">
        <button @click="handleCheckLogin" :disabled="isLoading">检查登录状态</button>
        <button v-if="isLoggedIn" @click="handleLogout" :disabled="isLoading">登出</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #42b983;
}

.card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

h2 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin: 15px 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

input[type="checkbox"] {
  margin-right: 5px;
}

button {
  background: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background: #35a372;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
}

.error {
  color: #e74c3c;
  font-weight: bold;
}

pre {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

.json-display {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
}

.json-content {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
}

.json-placeholder {
  color: #999;
  font-style: italic;
  margin-bottom: 15px;
}
</style>
