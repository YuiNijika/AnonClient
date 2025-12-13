/**
 * 认证状态管理 Store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginCredentials, LoginData } from '../api/types'
import { apiService } from '../api/core'
import { API_ENDPOINTS } from '../api/config'
import { getStoredUser, setStoredUser, clearStoredUser, getStoredToken, setStoredToken, clearStoredToken } from '../utils/storage'
import { memoryCache, CACHE_CONFIG } from '../utils/cache'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<UserInfo | null>(null)
  const isLoggedIn = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性
  const username = computed(() => user.value?.username || '')
  const email = computed(() => user.value?.email || '')

  /**
   * 从本地存储初始化
   */
  function initFromStorage() {
    const storedUser = getStoredUser<UserInfo>()
    if (storedUser) {
      user.value = storedUser
      isLoggedIn.value = true
    }
  }

  /**
   * 用户登录
   */
  async function login(credentials: LoginCredentials): Promise<LoginData | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.post<LoginData>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      )

      if (response.success && response.data) {
        const loginData = response.data
        user.value = {
          user_id: loginData.user_id,
          username: loginData.username,
          email: loginData.email,
          logged_in: true,
        }
        isLoggedIn.value = true

        // 保存到本地存储
        setStoredUser(user.value)

        // 保存 Token（如果返回了 Token）
        if (loginData.token) {
          setStoredToken(loginData.token)
          apiService.setToken(loginData.token)
        }

        // 清除用户信息缓存
        memoryCache.delete('user_info')

        // 延迟后重新检查登录状态，确保 Cookie 已设置
        // 这可以确保登录状态与服务器同步
        // 注意：浏览器需要时间来处理 Set-Cookie 响应头
        setTimeout(async () => {
          try {
            const loggedIn = await checkLoginStatus()
            if (!loggedIn) {
              // 如果检查后发现未登录，清除本地状态
              console.warn('登录后检查状态失败，Cookie 可能未正确设置')
              user.value = null
              isLoggedIn.value = false
              clearStoredUser()
            }
          } catch (err) {
            console.warn('登录后检查状态失败:', err)
          }
        }, 500)

        return loginData
      }

      throw new Error(response.message || '登录失败')
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录过程中发生错误'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户登出
   */
  async function logout(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGOUT)

      if (response.success) {
        user.value = null
        isLoggedIn.value = false

        // 清除本地存储
        clearStoredUser()
        clearStoredToken()
        apiService.clearToken()

        // 清除缓存
        memoryCache.clear()
      } else {
        throw new Error(response.message || '登出失败')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登出过程中发生错误'
      error.value = message
      // 即使登出失败，也清除本地状态
      user.value = null
      isLoggedIn.value = false
      clearStoredUser()
      clearStoredToken()
      apiService.clearToken()
      memoryCache.clear()
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 检查登录状态
   */
  async function checkLoginStatus(): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.get<{ logged_in: boolean }>(
        API_ENDPOINTS.AUTH.CHECK_LOGIN
      )

      if (response.success && response.data) {
        const loggedIn = response.data.logged_in
        isLoggedIn.value = loggedIn

        // 如果未登录，清除用户信息
        if (!loggedIn) {
          user.value = null
          clearStoredUser()
          memoryCache.clear()
        }

        return loggedIn
      }

      isLoggedIn.value = false
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查登录状态时发生错误'
      error.value = message
      isLoggedIn.value = false
      user.value = null
      clearStoredUser()
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null
  }

  // 初始化
  initFromStorage()

  return {
    // 状态
    user: computed(() => user.value),
    isLoggedIn: computed(() => isLoggedIn.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    username,
    email,

    // 方法
    login,
    logout,
    checkLoginStatus,
    clearError,
    initFromStorage,
  }
})

