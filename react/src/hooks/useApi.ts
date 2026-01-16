import { useMemo, useCallback } from 'react'

interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

const API_BASE_URLS = {
  dev: '/anon-dev-server',
  prod: import.meta.env.VITE_API_BASE_URL || 'http://anon.localhost:8080',
} as const

const DEFAULT_API_BASE_URL = import.meta.env.DEV ? API_BASE_URLS.dev : API_BASE_URLS.prod

/**
 * 构建查询字符串
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return ''
  const entries = Object.entries(params)
    .filter(([_, v]) => v != null)
    .map(([k, v]) => [k, String(v)])
  return entries.length > 0 ? `?${new URLSearchParams(entries).toString()}` : ''
}

/**
 * 刷新 Token
 */
async function refreshToken(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/auth/token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data: ApiResponse<{ token?: string }> = await res.json()

    if (data.code === 200 && data.data?.token) {
      localStorage.setItem('token', data.data.token)
      return true
    }
  } catch {
    // 静默失败
  }
  return false
}

/**
 * API Hook
 */
export function useApi() {
  const baseUrl = DEFAULT_API_BASE_URL

  /**
   * 发送请求
   */
  const request = useCallback(
    async <T = any>(
      endpoint: string,
      options: RequestInit = {},
      retryOnAuth = true
    ): Promise<ApiResponse<T>> => {
      const url = `${baseUrl}${endpoint}`
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      // 优先使用本地token，避免不必要的请求
      const token = localStorage.getItem('token')
      if (token) {
        (headers as Record<string, string>)['X-API-Token'] = token
      }

      try {
        const res = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        })
        const data: ApiResponse<T> = await res.json()

        // 处理认证错误
        const isAuthError = data.code === 401 || data.code === 403 || res.status === 401 || res.status === 403

        if (isAuthError) {
          // 尝试刷新 token
          if (retryOnAuth && (await refreshToken(baseUrl))) {
            return request<T>(endpoint, options, false)
          }
          localStorage.removeItem('token')
        }

        if (data.code !== 200) {
          throw new Error(data.message || '请求失败')
        }

        // 保存返回的 token
        if (data.data && typeof data.data === 'object' && 'token' in data.data) {
          const tokenValue = (data.data as { token?: string }).token
          if (tokenValue) {
            localStorage.setItem('token', tokenValue)
          }
        }

        return data
      } catch (error) {
        if (error instanceof Error) {
          const isAuthError = error.message.includes('401') || error.message.includes('403')
          if (isAuthError && retryOnAuth && (await refreshToken(baseUrl))) {
            return request<T>(endpoint, options, false)
          }
          if (isAuthError) {
            localStorage.removeItem('token')
          }
          throw error
        }
        throw new Error('网络请求失败')
      }
    },
    [baseUrl]
  )

  return useMemo(
    () => ({
      get: <T = any>(endpoint: string, params?: Record<string, any>) => {
        const query = buildQueryString(params)
        return request<T>(`${endpoint}${query}`, { method: 'GET' })
      },
      post: <T = any>(endpoint: string, body?: any) =>
        request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
      put: <T = any>(endpoint: string, body?: any) =>
        request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
      delete: <T = any>(endpoint: string) =>
        request<T>(endpoint, { method: 'DELETE' }),
    }),
    [request]
  )
}
