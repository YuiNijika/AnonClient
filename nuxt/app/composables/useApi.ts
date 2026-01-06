interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return ''
  const entries = Object.entries(params)
    .filter(([_, v]) => v != null)
    .map(([k, v]) => [k, String(v)])
  return entries.length > 0 ? '?' + new URLSearchParams(entries).toString() : ''
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie('token')
  const baseUrl = config.public.apiBaseUrl

  const request = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    if (import.meta.server && baseUrl.startsWith('/')) {
      return { code: 500, message: 'SSR proxy skip' } as any
    }

    const url = `${baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }
    if (token.value) headers['X-API-Token'] = token.value

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`)
      }

      const data: ApiResponse<T> = await res.json()

      // 处理认证失败（401/403）
      if (data.code === 401 || data.code === 403 || res.status === 401 || res.status === 403) {
        // Token 过期或无效，清除 Token 和用户状态
        token.value = null
        // 触发重新检查登录状态（如果 auth store 可用）
        if (import.meta.client) {
          try {
            const { useAuthStore } = await import('../stores/auth')
            const authStore = useAuthStore()
            authStore.user = null
          } catch {
            // 静默失败，避免循环依赖
          }
        }
      }

      if (data.code !== 200) {
        throw new Error(data.message || '请求失败')
      }
      if (data.data && typeof data.data === 'object' && 'token' in data.data) {
        token.value = (data.data as any).token
      }
      return data
    } catch (error) {
      // 处理 HTTP 401/403 错误
      if (error instanceof Error && error.message.includes('401')) {
        token.value = null
        if (import.meta.client) {
          const { useAuthStore } = await import('../stores/auth')
          const authStore = useAuthStore()
          authStore.user = null
        }
      }
      console.error('API Request Failed:', error)
      if (error instanceof Error) throw error
      throw new Error('网络请求失败')
    }
  }

  return {
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
  }
}
