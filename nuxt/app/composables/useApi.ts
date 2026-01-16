interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

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
async function refreshToken(baseUrl: string, token: ReturnType<typeof useCookie<string | null>>): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/auth/token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data: ApiResponse<{ token?: string }> = await res.json()

    if (data.code === 200 && data.data?.token) {
      ; (token as { value: string | null }).value = data.data.token
      return true
    }
  } catch {
    // 静默失败
  }
  return false
}

/**
 * 清除认证状态
 */
async function clearAuth(token: ReturnType<typeof useCookie<string | null>>): Promise<void> {
  ; (token as { value: string | null }).value = null
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

/**
 * API 客户端
 */
export function useApi() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('token')
  const baseUrl = config.public.apiBaseUrl || '/anon-dev-server'

  /**
   * 发送请求
   */
  async function request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true
  ): Promise<ApiResponse<T>> {
    // SSR 时跳过相对路径请求
    if (import.meta.server && baseUrl.startsWith('/')) {
      return { code: 500, message: 'SSR proxy skip' } as any
    }

    const url = `${baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (token.value) {
      headers['X-API-Token'] = token.value
    }

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

      // 处理认证错误
      const isAuthError = data.code === 401 || data.code === 403 || res.status === 401 || res.status === 403

      if (isAuthError) {
        // 尝试刷新 token
        if (retryOnAuth && (await refreshToken(baseUrl, token))) {
          return request<T>(endpoint, options, false)
        }
        await clearAuth(token)
      }

      if (data.code !== 200) {
        throw new Error(data.message || '请求失败')
      }

      // 保存返回的 token
      if (data.data && typeof data.data === 'object' && 'token' in data.data) {
        const tokenValue = (data.data as { token?: string }).token
        if (tokenValue) {
          ; (token as { value: string | null }).value = tokenValue
        }
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        const isAuthError = error.message.includes('401') || error.message.includes('403')
        if (isAuthError && retryOnAuth && (await refreshToken(baseUrl, token))) {
          return request<T>(endpoint, options, false)
        }
        if (isAuthError) {
          await clearAuth(token)
        }
        throw error
      }
      throw new Error('网络请求失败')
    }
  }

  return {
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
  }
}
