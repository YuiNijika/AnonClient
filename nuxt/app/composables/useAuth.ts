import { authApi, handleApiError, normalizeApiResponse } from './useApiService'
import { memoryCache } from './utils/cache'
import { getStoredUser, setStoredUser, clearStoredUser, setStoredToken, clearStoredToken } from './utils/storage'
import { apiService } from './api/core'
import type { LoginCredentials, LoginStatusResponse, LoginResponse, UserInfo } from './api/types'

const CACHE_DURATION = 5 * 60 * 1000
const CACHE_KEY = 'auth_status'

export const useAuth = () => {
  const checkLoginStatus = async (force: boolean = false): Promise<LoginStatusResponse> => {
    if (!force) {
      const cached = memoryCache.get<LoginStatusResponse>(CACHE_KEY)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await authApi.checkLogin()
      const data = normalizeApiResponse<LoginStatusResponse>(response)
      const responseData = (response as any).data || {}
      const loggedIn = responseData.logged_in ?? false

      if (data.success && loggedIn) {
        const result: LoginStatusResponse = {
          success: true,
          logged_in: true
        }
        memoryCache.set(CACHE_KEY, result, CACHE_DURATION)
        return result
      } else if (data.success && !loggedIn) {
        clearStoredUser()
        const result: LoginStatusResponse = {
          success: true,
          logged_in: false
        }
        memoryCache.set(CACHE_KEY, result, CACHE_DURATION)
        return result
      }

      return data as LoginStatusResponse
    } catch (error) {
      console.error('检查登录状态失败:', error)
      return {
        success: false,
        logged_in: false,
        message: handleApiError(error, '检查登录状态失败')
      }
    }
  }

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await authApi.login(credentials)
      const data = normalizeApiResponse<UserInfo>(response)
      memoryCache.delete(CACHE_KEY)

      if (data.success && response.data) {
        const loginData = response.data as any
        
        if (loginData.token) {
          setStoredToken(loginData.token)
          apiService.setToken(loginData.token)
        }
      }

      return {
        success: data.success,
        message: data.message || (data.success ? '登录成功' : '登录失败'),
        data: response.data || undefined
      }
    } catch (error) {
      console.error('登录请求失败:', error)
      return {
        success: false,
        message: handleApiError(error, '登录失败')
      }
    }
  }

  const logout = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.logout()
      const data = normalizeApiResponse(response)
      memoryCache.delete(CACHE_KEY)

      clearStoredToken()
      apiService.clearToken()

      return {
        success: data.success,
        message: data.message || (data.success ? '登出成功' : '登出失败')
      }
    } catch (error) {
      console.error('登出请求失败:', error)
      memoryCache.delete(CACHE_KEY)
      clearStoredToken()
      apiService.clearToken()
      return {
        success: false,
        message: handleApiError(error, '登出失败')
      }
    }
  }

  const clearCache = (): void => {
    memoryCache.delete(CACHE_KEY)
  }

  return {
    checkLoginStatus,
    login,
    logout,
    clearCache
  }
}
