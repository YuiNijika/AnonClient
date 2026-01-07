import { useMemo, useCallback } from 'react'

interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

const API_BASE_URLS: string[] = [
  'http://anon.localhost:8080',
  '/anon-dev-server',
]

const API_BASE_URL = import.meta.env.DEV ? API_BASE_URLS[1] : API_BASE_URLS[0]

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return ''
  const entries = Object.entries(params)
    .filter(([_, v]) => v != null)
    .map(([k, v]) => [k, String(v)])
  return entries.length > 0 ? '?' + new URLSearchParams(entries).toString() : ''
}

export const useApi = () => {
  const baseUrl = API_BASE_URL

  const request = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const url = `${baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    const token = localStorage.getItem('token')
    if (token) {
      ; (headers as Record<string, string>)['X-API-Token'] = token
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
      const data: ApiResponse<T> = await res.json()

      // 自动处理 Token 失效
      if ([401, 403].includes(data.code) || [401, 403].includes(res.status)) {
        localStorage.removeItem('token')
      }

      if (data.code !== 200) {
        throw new Error(data.message || '请求失败')
      }
      
      // 自动更新 Token
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
      }
      return data
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('网络请求失败')
    }
  }, [baseUrl])

  return useMemo(() => ({
    get: <T = any>(endpoint: string, params?: Record<string, any>) => {
      const query = buildQueryString(params)
      return request<T>(endpoint + query, { method: 'GET' })
    },
    post: <T = any>(endpoint: string, body?: any) =>
      request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T = any>(endpoint: string, body?: any) =>
      request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T = any>(endpoint: string) =>
      request<T>(endpoint, { method: 'DELETE' }),
  }), [request])
}
