/**
 * 验证码相关 composable
 */

import { ref, onMounted } from 'vue'
import { apiService } from './core'
import { API_ENDPOINTS } from './config'

export function useCaptcha() {
  const captchaImage = ref<string | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * 自动初始化验证码
   */
  const autoInit = async (): Promise<void> => {
    if (apiService.isCaptchaEnabled() && !captchaImage.value) {
      try {
        await getCaptcha()
      } catch (err) {
        console.warn('自动获取验证码失败:', err)
      }
    }
  }

  /**
   * 获取验证码
   */
  const getCaptcha = async (): Promise<string | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.get<{ image: string }>(
        API_ENDPOINTS.AUTH.GET_CAPTCHA
      )

      if (response.success && response.data?.image) {
        captchaImage.value = response.data.image
        return response.data.image
      }

      captchaImage.value = null
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取验证码时发生错误'
      error.value = message
      captchaImage.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新验证码
   */
  const refreshCaptcha = async (): Promise<string | null> => {
    return await getCaptcha()
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null
  }

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

