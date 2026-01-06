import type { useApi } from '@/hooks/useApi'

export interface LoginDTO {
  username?: string
  email?: string
  password?: string
  captcha?: string
  rememberMe?: boolean
  [key: string]: any
}

export interface LoginResponse {
  token?: string
  user?: UserInfo
}

export interface CheckLoginResponse {
  logged_in?: boolean
  loggedIn?: boolean
}

export interface TokenResponse {
  token?: string
}

export interface UserInfo {
  uid: number
  name: string
  email?: string
  [key: string]: any
}

// React 的 useApi 返回的是包含 post/get 方法的对象
type ApiClient = ReturnType<typeof useApi>

export const AuthApi = {
  login: (api: ApiClient, data: LoginDTO) => {
    return api.post<LoginResponse>('/auth/login', data)
  },
  
  register: (api: ApiClient, data: LoginDTO) => {
    return api.post<LoginResponse>('/auth/register', data)
  },
  
  logout: (api: ApiClient) => {
    return api.post('/auth/logout')
  },
  
  checkLogin: (api: ApiClient) => {
    return api.get<CheckLoginResponse>('/auth/check-login')
  },
  
  getToken: (api: ApiClient) => {
    return api.get<TokenResponse>('/auth/token')
  }
}

