/**
 * API 相关类型定义
 */

// 基础响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string | null
  data?: T
  [key: string]: any
}

// 登录凭据
export interface LoginCredentials {
  username: string
  password: string
  captcha?: string
  rememberMe?: boolean
}

// 用户信息
export interface UserInfo {
  user_id?: number
  uid?: number
  username: string
  name?: string
  email: string
  avatar?: string
  group?: 'admin' | 'author' | 'user'
  logged_in?: boolean
  [key: string]: any
}

// 登录状态响应
export interface LoginStatusResponse {
  success: boolean
  logged_in: boolean
  user?: UserInfo
  message?: string
}

// 登录响应数据
export interface LoginData {
  user_id: number
  username: string
  email: string
  logged_in?: boolean
}

// 检查登录响应数据
export interface CheckLoginData {
  logged_in: boolean
}

// API 配置
export interface ApiConfig {
  baseUrl: string
  timeout: number
  retryCount: number
  retryDelay: number
}

// 请求选项
export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

