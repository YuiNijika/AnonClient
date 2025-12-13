/**
 * API配置文件
 * 集中管理所有API相关的配置
 */

import type { ApiConfig } from './types'

// API 基础地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://anon.localhost:8080'

// 是否使用代理
// true 使用代理 /apiService
// false 直接请求后端
const USE_PROXY = import.meta.env.VITE_USE_PROXY !== 'false' // 默认使用代理

/**
 * 获取 API 基础 URL
 */
const getBaseUrl = (): string => {
  if (USE_PROXY) {
    return '/apiService'
  }
  return API_BASE_URL
}

export const API_CONFIG: ApiConfig = {
  get baseUrl() {
    return getBaseUrl()
  },
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000
}

// API端点
export const API_ENDPOINTS = {
  // 配置相关
  CONFIG: {
    GET_CONFIG: '/anon/common/config',
  },
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHECK_LOGIN: '/auth/check-login',
    GET_TOKEN: '/auth/token',
    GET_CAPTCHA: '/auth/captcha',
  },
  // 用户相关
  USER: {
    INFO: '/user/info',
  },
} as const

// Token 存储键
export const TOKEN_STORAGE_KEY = 'api_token'

// 配置存储键
export const CONFIG_STORAGE_KEY = 'api_config'

// 导出配置常量
export { API_BASE_URL, USE_PROXY }

