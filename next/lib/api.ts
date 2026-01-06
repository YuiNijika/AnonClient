interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

const API_BASE_URLS: string[] = [
  'http://anon.localhost:8080',
  '/anon-dev-server',
]

// 通过修改索引切换地址：0=直接地址，1=代理模式
const API_BASE_URL =
  process.env.NODE_ENV === 'development' ? API_BASE_URLS[1] : API_BASE_URLS[0]

const baseUrl = API_BASE_URL

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return ''
  const entries = Object.entries(params)
    .filter(([_, v]) => v != null)
    .map(([k, v]) => [k, String(v)])
  return entries.length > 0 ? '?' + new URLSearchParams(entries).toString() : ''
}

const request = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${baseUrl}${endpoint}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      ; (headers as Record<string, string>)['X-API-Token'] = token
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
      const data: ApiResponse<T> = await res.json()

      // 处理认证失败，状态码为401或403
      if (data.code === 401 || data.code === 403 || res.status === 401 || res.status === 403) {
        // Token 过期或无效，清除 Token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        // 注意：Next.js 中需要在组件层面处理用户状态清除
      }

      if (data.code !== 200) {
        throw new Error(data.message || '请求失败')
      }
      if (data.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.data.token)
      }
      return data
    } catch (error) {
      // 处理 HTTP 401/403 错误
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      }
      if (error instanceof Error) throw error
      throw new Error('网络请求失败')
    }
}

export const api = {
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
