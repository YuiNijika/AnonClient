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

      if (data.code !== 200) {
        throw new Error(data.message || '请求失败')
      }
      if (data.data && typeof data.data === 'object' && 'token' in data.data) {
        token.value = (data.data as any).token
      }
      return data
    } catch (error) {
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
