'use client'

/**
 * 验证码相关 hook
 */

import { useState, useCallback } from 'react'
import { apiService } from './core'
import { API_ENDPOINTS } from './config'

export function useCaptcha() {
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 获取验证码
   */
  const getCaptcha = useCallback(async (): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.get<{ image: string }>(
        API_ENDPOINTS.AUTH.GET_CAPTCHA
      )

      if (response.success && response.data?.image) {
        setCaptchaImage(response.data.image)
        return response.data.image
      }

      setCaptchaImage(null)
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取验证码时发生错误'
      setError(message)
      setCaptchaImage(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 刷新验证码
   */
  const refreshCaptcha = useCallback(async (): Promise<string | null> => {
    return await getCaptcha()
  }, [getCaptcha])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 自动初始化验证码
   */
  const autoInit = useCallback(async (): Promise<void> => {
    if (apiService.isCaptchaEnabled() && !captchaImage) {
      try {
        await getCaptcha()
      } catch (err) {
        console.warn('自动获取验证码失败:', err)
      }
    }
  }, [captchaImage, getCaptcha])

  return {
    captchaImage,
    isLoading,
    error,
    getCaptcha,
    refreshCaptcha,
    clearError,
    autoInit
  }
}

