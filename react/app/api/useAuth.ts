/**
 * 认证相关 hook
 * 使用 React hooks 管理认证状态
 */

import { useState, useCallback } from 'react'
import type { LoginCredentials, LoginData } from './types'
import { apiService } from './core'
import { API_ENDPOINTS } from './config'
import { getStoredUser, setStoredUser, clearStoredUser } from '../utils/storage'
import { setStoredToken, clearStoredToken } from '../utils/storage'
import { memoryCache } from '../utils/cache'
import type { UserInfo } from './types'

export function useAuth() {
  // 从本地存储初始化
  const [user, setUser] = useState<UserInfo | null>(() => getStoredUser<UserInfo>())
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!user)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 检查登录状态
   */
  const checkLoginStatus = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.get<{ logged_in: boolean }>(
        API_ENDPOINTS.AUTH.CHECK_LOGIN
      )

      if (response.success && response.data) {
        const loggedIn = response.data.logged_in
        setIsLoggedIn(loggedIn)

        // 如果未登录，清除用户信息
        if (!loggedIn) {
          setUser(null)
          clearStoredUser()
          memoryCache.clear()
        }

        return loggedIn
      }

      setIsLoggedIn(false)
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查登录状态时发生错误'
      setError(message)
      setIsLoggedIn(false)
      setUser(null)
      clearStoredUser()
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 用户登录
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginData | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.post<LoginData>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      )

      if (response.success && response.data) {
        const loginData = response.data
        const userInfo: UserInfo = {
          user_id: loginData.user_id,
          username: loginData.username,
          email: loginData.email,
          logged_in: true,
        }

        setUser(userInfo)
        setIsLoggedIn(true)
        setStoredUser(userInfo)

        // 保存 Token（如果返回了 Token）
        if (loginData.token) {
          setStoredToken(loginData.token)
          apiService.setToken(loginData.token)
        }

        // 清除用户信息缓存
        memoryCache.delete('user_info')

        // 延迟后重新检查登录状态，确保 Cookie 已设置
        // 注意：浏览器需要时间来处理 Set-Cookie 响应头
        // 使用直接调用 API 的方式，避免循环依赖
        setTimeout(async () => {
          try {
            const response = await apiService.get<{ logged_in: boolean }>(
              API_ENDPOINTS.AUTH.CHECK_LOGIN
            )
            if (response.success && response.data) {
              const loggedIn = response.data.logged_in
              if (!loggedIn) {
                // 如果检查后发现未登录，清除本地状态
                console.warn('登录后检查状态失败，Cookie 可能未正确设置')
                setUser(null)
                setIsLoggedIn(false)
                clearStoredUser()
              }
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
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 用户登出
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGOUT)

      if (response.success) {
        setUser(null)
        setIsLoggedIn(false)
        clearStoredUser()
        clearStoredToken()
        apiService.clearToken()
        memoryCache.clear()
      } else {
        throw new Error(response.message || '登出失败')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登出过程中发生错误'
      setError(message)
      // 即使登出失败，也清除本地状态
      setUser(null)
      setIsLoggedIn(false)
      clearStoredUser()
      clearStoredToken()
      apiService.clearToken()
      memoryCache.clear()
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // 状态
    user,
    isLoggedIn,
    isLoading,
    error,

    // 方法
    login,
    logout,
    checkLogin: checkLoginStatus,
    clearError,
  }
}
