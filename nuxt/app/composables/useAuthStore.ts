import { defineStore } from 'pinia'
import { useAuth } from './useAuth'
import { useUserManager } from './useApiService'
import { getStoredUser, setStoredUser, clearStoredUser, getStoredToken, clearStoredToken } from './utils/storage'
import { apiService } from './api/core'
import type { UserInfo, LoginStatusResponse } from './api/types'

interface AuthState {
  user: UserInfo | null
  isAuthenticated: boolean
  initialized: boolean
}

let checkPromise: Promise<LoginStatusResponse> | null = null

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    initialized: false
  }),

  getters: {
    isLoggedIn: (state): boolean => state.isAuthenticated && state.user !== null
  },

  actions: {
    setUser(user: UserInfo | null): void {
      this.user = user
      this.isAuthenticated = !!user
      if (user) {
        setStoredUser(user)
      } else {
        clearStoredUser()
      }
    },

    clearUser(): void {
      this.user = null
      this.isAuthenticated = false
      clearStoredUser()
      clearStoredToken()
      apiService.clearToken()
    },

    initFromStorage(): void {
      const storedUser = getStoredUser()
      if (storedUser) {
        this.user = storedUser
        this.isAuthenticated = true
      }
      
      const token = getStoredToken()
      if (token) {
        apiService.setToken(token)
      }
    },

    async checkAuthStatus(force: boolean = false): Promise<LoginStatusResponse> {
      if (!force && checkPromise) {
        return checkPromise
      }

      if (this.initialized && !force) {
        return {
          success: true,
          logged_in: this.isAuthenticated,
          user: this.user || undefined
        }
      }

      checkPromise = this._performCheck()

      try {
        return await checkPromise
      } finally {
        checkPromise = null
      }
    },

    async _performCheck(): Promise<LoginStatusResponse> {
      try {
        if (!this.initialized) {
          this.initFromStorage()
        }

        const { checkLoginStatus } = useAuth()
        const result = await checkLoginStatus()

        if (result.success && result.logged_in) {
          this.isAuthenticated = true
          if (!this.user) {
            this.initFromStorage()
          }
          if (result.user) {
            this.setUser(result.user)
          }
        } else {
          this.clearUser()
        }

        this.initialized = true
        return result
      } catch (error) {
        console.error('检查认证状态失败:', error)
        return {
          success: false,
          logged_in: false,
          message: '网络错误'
        }
      }
    },

    async logout(): Promise<{ success: boolean; message?: string }> {
      try {
        const { logout } = useAuth()
        const result = await logout()

        this.clearUser()
        this.initialized = false

        return result
      } catch (error) {
        console.error('登出失败:', error)
        this.clearUser()
        this.initialized = false
        return {
          success: false,
          message: '网络错误'
        }
      }
    },

    resetInitialization(): void {
      this.initialized = false
      checkPromise = null
    },

    async loadUserInfo(): Promise<{ success: boolean; data?: UserInfo; message?: string }> {
      if (!this.isAuthenticated) {
        return { success: false, message: '用户未登录' }
      }

      if (this.user) {
        return { success: true, data: this.user }
      }

      try {
        const { getUserInfo } = useUserManager()
        const userInfoResult = await getUserInfo()

        if (userInfoResult.success && userInfoResult.logged_in && userInfoResult.data) {
          this.setUser(userInfoResult.data)
          return { success: true, data: userInfoResult.data }
        } else {
          this.clearUser()
          return { success: false, message: '获取用户信息失败' }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return { success: false, message: '网络错误' }
      }
    }
  }
})
