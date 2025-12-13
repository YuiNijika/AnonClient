/**
 * 核心API服务类
 * 提供基础的HTTP请求功能和重试机制
 */

import { API_CONFIG, API_ENDPOINTS, TOKEN_STORAGE_KEY } from './config'
import type { ApiResponse, RequestOptions } from './types'
import { getStoredToken, setStoredToken, clearStoredToken } from '../utils/storage'

export class ApiService {
  private tokenEnabled: boolean = false
  private configLoaded: boolean = false
  private tokenFetching: Promise<string | null> | null = null

  /**
   * 获取 baseUrl
   */
  private getBaseUrl(): string {
    return API_CONFIG.baseUrl
  }

  /**
   * 初始化配置
   */
  async initConfig(): Promise<void> {
    if (this.configLoaded) {
      return
    }

    try {
      const response = await this.request<{ token: boolean }>(
        API_ENDPOINTS.CONFIG.GET_CONFIG,
        { method: 'GET' }
      )

      if (response.success && response.data) {
        this.tokenEnabled = response.data.token
        this.configLoaded = true
      }
    } catch (error) {
      console.warn('获取配置失败，使用默认配置:', error)
      this.tokenEnabled = false
      this.configLoaded = true
    }
  }

  /**
   * 获取 Token
   */
  getToken(): string | null {
    return getStoredToken()
  }

  /**
   * 设置 Token
   */
  setToken(token: string): void {
    setStoredToken(token)
  }

  /**
   * 清除 Token
   */
  clearToken(): void {
    clearStoredToken()
  }

  /**
   * 检查是否启用 Token
   */
  isTokenEnabled(): boolean {
    return this.tokenEnabled
  }

  /**
   * 自动获取 Token（如果缺失且已启用）
   * 通过 Cookie/Session 自动识别用户并获取 Token
   * 注意：只有在用户已登录的情况下才会尝试获取 Token
   */
  private async fetchTokenIfNeeded(): Promise<string | null> {
    // 如果未启用 Token，直接返回 null
    if (!this.tokenEnabled) {
      return null
    }

    // 如果已有 Token，直接返回
    const existingToken = this.getToken()
    if (existingToken) {
      return existingToken
    }

    // 检查用户是否已登录（通过检查本地存储的用户信息）
    // 如果用户未登录，不尝试获取 Token，避免不必要的请求
    try {
      const { getStoredUser } = await import('../utils/storage')
      const user = getStoredUser()
      if (!user) {
        // 用户未登录，不尝试获取 Token
        return null
      }
    } catch (error) {
      // 无法检查用户状态，不尝试获取 Token
      return null
    }

    // 如果正在获取 Token，等待当前请求完成
    if (this.tokenFetching) {
      return await this.tokenFetching
    }

    // 创建新的 Token 获取请求
    this.tokenFetching = (async () => {
      try {
        // 调用 /auth/token 接口，通过 Cookie 自动识别用户
        const response = await this.request<{ token?: string; token_enabled?: boolean }>(
          API_ENDPOINTS.AUTH.GET_TOKEN,
          { method: 'GET' }
        )

        if (response.success && response.data?.token) {
          this.setToken(response.data.token)
          return response.data.token
        }

        return null
      } catch (error) {
        // 获取 Token 失败（可能是用户未登录），静默失败
        console.debug('自动获取 Token 失败（可能用户未登录）:', error)
        return null
      } finally {
        // 清除获取状态
        this.tokenFetching = null
      }
    })()

    return await this.tokenFetching
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 基础请求方法
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.replace(/^\//, '')
    const url = `${this.getBaseUrl()}/${cleanEndpoint}`
    const { timeout, retryCount, retryDelay } = API_CONFIG

    const defaultOptions: RequestOptions = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // 添加重试机制
    let lastError: Error | unknown
    for (let i = 0; i < retryCount; i++) {
      try {
        return await this._handleClientRequest<T>(url, defaultOptions, timeout)
      } catch (error) {
        lastError = error
        console.error(`API请求失败 [${endpoint}] (第${i + 1}次尝试):`, error)

        // 如果是最后一次重试，抛出错误
        if (i === retryCount - 1) {
          throw lastError
        }

        // 计算重试延迟
        await this._handleRetryDelay(error, i, retryDelay)
      }
    }
    throw lastError
  }

  /**
   * 处理客户端环境下的请求
   */
  private async _handleClientRequest<T>(
    url: string,
    defaultOptions: RequestOptions,
    timeout: number
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // 构建完整的URL，包括查询参数
      let fullUrl = url
      if (defaultOptions.params) {
        const searchParams = new URLSearchParams(
          defaultOptions.params as Record<string, string>
        )
        const queryString = searchParams.toString()
        if (queryString) {
          fullUrl += (url.includes('?') ? '&' : '?') + queryString
        }
      }

      // 准备请求选项
      const headers = new Headers(defaultOptions.headers as HeadersInit)
      
      // 如果启用 Token，自动获取并添加到请求头
      if (this.tokenEnabled) {
        // 先尝试从存储获取
        let token = this.getToken()
        
        // 如果没有 Token，且不是获取 Token 的请求，尝试自动获取
        if (!token && !fullUrl.includes(API_ENDPOINTS.AUTH.GET_TOKEN)) {
          token = await this.fetchTokenIfNeeded()
        }
        
        if (token) {
          headers.set('X-API-Token', token)
        }
      }

      const fetchOptions: RequestInit = {
        method: defaultOptions.method || 'GET',
        headers,
        signal: controller.signal,
        credentials: 'include',
      }

      // 对于POST、PUT等请求，添加body
      if (defaultOptions.body) {
        fetchOptions.body = defaultOptions.body
      }

      const response = await fetch(fullUrl, fetchOptions)

      clearTimeout(timeoutId)

      // 处理特定的HTTP状态码
      if (response.status === 401) {
        // 触发登出逻辑
        try {
          const { useAuthStore } = await import('../stores/auth')
          const authStore = useAuthStore()
          await authStore.logout()
        } catch (e) {
          console.warn('登出逻辑执行失败:', e)
        }
        throw new Error('未授权访问')
      }

      const contentType = response.headers.get('content-type')
      let responseData: ApiResponse<T>
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        // 如果响应不是JSON格式，返回一个标准格式
        responseData = {
          success: response.ok,
          data: (await response.text()) as any,
        }
      }

      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`, {
          cause: {
            status: response.status,
            data: responseData,
          },
        } as ErrorOptions)
      }

      return responseData
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 处理重试延迟
   */
  private async _handleRetryDelay(
    error: unknown,
    retryIndex: number,
    baseRetryDelay: number
  ): Promise<void> {
    // 对于网络错误和超时错误，增加重试延迟
    const isNetworkError =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Failed to fetch'))
    const currentRetryDelay = isNetworkError
      ? baseRetryDelay * Math.pow(2, retryIndex) * 2
      : baseRetryDelay * Math.pow(2, retryIndex)

    console.log(`等待 ${currentRetryDelay}ms 后重试...`)
    await this.delay(currentRetryDelay)
  }

  /**
   * GET请求
   */
  async get<T = any>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
    })
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * PUT请求
   */
  async put<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// 创建API服务实例
export const apiService = new ApiService()

