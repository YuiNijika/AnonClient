/**
 * 用户相关 composable
 */

import { ref, computed } from 'vue'
import type { UserInfo } from './types'
import { apiService } from './core'
import { API_ENDPOINTS } from './config'
import { memoryCache, CACHE_CONFIG } from '../utils/cache'
import { setStoredToken } from '../utils/storage'

export function useUser() {
  const userInfo = ref<UserInfo | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * 获取用户信息
   */
  const getUserInfo = async (forceRefresh = false): Promise<UserInfo | null> => {
    // 检查缓存
    if (!forceRefresh) {
      const cached = memoryCache.get<UserInfo>('user_info')
      if (cached) {
        userInfo.value = cached
        return cached
      }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.get<UserInfo>(API_ENDPOINTS.USER.INFO)

      if (response.success && response.data) {
        userInfo.value = response.data

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

      userInfo.value = null
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用户信息时发生错误'
      error.value = message
      userInfo.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除用户信息
   */
  const clearUserInfo = () => {
    userInfo.value = null
    memoryCache.delete('user_info')
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    userInfo: computed(() => userInfo.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // 方法
    getUserInfo,
    clearUserInfo,
    clearError,
  }
}
