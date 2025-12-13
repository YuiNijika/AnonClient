/**
 * 认证相关 composable
 * 使用 Pinia store 管理状态
 */

import { useAuthStore } from '../stores/auth'
import type { LoginCredentials, LoginData } from './types'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    // 状态
    isLoggedIn: authStore.isLoggedIn,
    isLoading: authStore.isLoading,
    error: authStore.error,
    user: authStore.user,
    username: authStore.username,
    email: authStore.email,

    // 方法
    login: (credentials: LoginCredentials) => authStore.login(credentials),
    logout: () => authStore.logout(),
    checkLogin: () => authStore.checkLoginStatus(),
    clearError: () => authStore.clearError(),
  }
}
