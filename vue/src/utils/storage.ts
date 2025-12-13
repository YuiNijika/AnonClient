/**
 * 本地存储工具函数
 */

const STORAGE_KEY = {
  USER: 'user_info',
  TOKEN: 'api_token',
  CONFIG: 'api_config'
} as const

/**
 * 获取存储的用户信息
 */
export function getStoredUser<T = any>(): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY.USER)
    if (!stored) {
      return null
    }
    return JSON.parse(stored) as T
  } catch (error) {
    console.error('读取用户信息失败:', error)
    return null
  }
}

/**
 * 设置存储的用户信息
 */
export function setStoredUser<T = any>(user: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(user))
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}

/**
 * 清除存储的用户信息
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY.USER)
  } catch (error) {
    console.error('清除用户信息失败:', error)
  }
}

/**
 * 获取存储的 Token
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return localStorage.getItem(STORAGE_KEY.TOKEN)
  } catch (error) {
    console.error('读取 Token 失败:', error)
    return null
  }
}

/**
 * 设置存储的 Token
 */
export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY.TOKEN, token)
  } catch (error) {
    console.error('保存 Token 失败:', error)
  }
}

/**
 * 清除存储的 Token
 */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY.TOKEN)
  } catch (error) {
    console.error('清除 Token 失败:', error)
  }
}

/**
 * 获取存储的配置
 */
export function getStoredConfig<T = any>(): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY.CONFIG)
    if (!stored) {
      return null
    }
    return JSON.parse(stored) as T
  } catch (error) {
    console.error('读取配置失败:', error)
    return null
  }
}

/**
 * 设置存储的配置
 */
export function setStoredConfig<T = any>(config: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY.CONFIG, JSON.stringify(config))
  } catch (error) {
    console.error('保存配置失败:', error)
  }
}

