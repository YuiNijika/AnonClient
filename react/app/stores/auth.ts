/**
 * 认证状态管理工具函数
 * 提供状态管理的辅助函数，配合 hooks 使用
 */

import type { UserInfo } from '../api/types'
import { getStoredUser, setStoredUser, clearStoredUser } from '../utils/storage'

/**
 * 从本地存储初始化用户信息
 */
export function initAuthFromStorage(): { user: UserInfo | null; isLoggedIn: boolean } {
  const storedUser = getStoredUser<UserInfo>()
  return {
    user: storedUser,
    isLoggedIn: !!storedUser,
  }
}

/**
 * 保存用户信息到本地存储
 */
export function saveAuthToStorage(user: UserInfo | null): void {
  if (user) {
    setStoredUser(user)
  } else {
    clearStoredUser()
  }
}

