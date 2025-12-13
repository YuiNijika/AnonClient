/**
 * 用户相关 hook
 */

import { useState, useCallback } from 'react'
import type { UserInfo } from './types'
import { apiService } from './core'
import { API_ENDPOINTS } from './config'
import { memoryCache, CACHE_CONFIG } from '../utils/cache'
import { setStoredToken } from '../utils/storage'

export function useUser() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 获取用户信息
   */
  const getUserInfo = useCallback(async (forceRefresh = false): Promise<UserInfo | null> => {
    // 检查缓存
    if (!forceRefresh) {
      const cached = memoryCache.get<UserInfo>('user_info')
      if (cached) {
        setUserInfo(cached)
        return cached
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.get<UserInfo>(API_ENDPOINTS.USER.INFO)

      if (response.success && response.data) {
        setUserInfo(response.data)

        // 保存 Token（如果返回了 Token）
        if (response.data.token) {
          setStoredToken(response.data.token)
          apiService.setToken(response.data.token)
        }

        // 缓存用户信息（不包含 token）
        const { token, ...userData } = response.data
        memoryCache.set('user_info', userData, CACHE_CONFIG.USER_CACHE_DURATION)

        return response.data
      }

      setUserInfo(null)
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用户信息时发生错误'
      setError(message)
      setUserInfo(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 清除用户信息
   */
  const clearUserInfo = useCallback(() => {
    setUserInfo(null)
    memoryCache.delete('user_info')
  }, [])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // 状态
    userInfo,
    isLoading,
    error,

    // 方法
    getUserInfo,
    clearUserInfo,
    clearError,
  }
}
