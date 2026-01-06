'use client'

import { useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

interface UserInfo {
  uid: number
  name: string
  email?: string
  [key: string]: any
}

interface LoginResponse {
  token?: string
  user?: UserInfo
}

interface CheckLoginResponse {
  logged_in?: boolean
  loggedIn?: boolean
}

interface TokenResponse {
  token?: string
}

// 封装获取用户信息的通用逻辑
const fetchUserInfo = async (api: typeof api) => {
  try {
    const userRes = await api.get<UserInfo>('/user/info')
    return userRes.data || null
  } catch {
    return null
  }
}

// 封装获取 token 的通用逻辑
const fetchToken = async (api: typeof api) => {
  try {
    const tokenRes = await api.get<TokenResponse>('/auth/token')
    return tokenRes.data?.token || null
  } catch {
    return null
  }
}

export const useAuth = () => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkingRef = useRef(false)

  const login = useCallback(async (data: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<LoginResponse>('/auth/login', data)
      // 设置 token
      if (res.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.token)
      }
      // 通过 /user/info 获取完整用户信息
      const userInfo = await fetchUserInfo(api)
      if (userInfo) {
        setUser(userInfo)
      }
      return res
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<LoginResponse>('/auth/register', data)
      // 设置 token
      if (res.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.token)
      }
      // 直接使用返回的用户信息
      if (res.data?.user) {
        setUser(res.data.user)
      } else {
        // 如果没有返回用户信息，则通过 /user/info 获取
        const userInfo = await fetchUserInfo(api)
        if (userInfo) {
          setUser(userInfo)
        }
      }
      return res
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await api.post('/auth/logout')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      setUser(null)
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }, [])

  const checkLogin = useCallback(async (): Promise<boolean> => {
    // 防止重复请求（开发模式下可能导致重复调用）
    if (checkingRef.current) {
      return !!user
    }
    checkingRef.current = true
    try {
      const res = await api.get<CheckLoginResponse>('/auth/check-login')
      const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false
      if (loggedIn) {
        // 已登录则获取 token 和用户信息
        const token = await fetchToken(api)
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
        const userInfo = await fetchUserInfo(api)
        if (userInfo) {
          setUser(userInfo)
          checkingRef.current = false
          return true
        }
      }
      setUser(null)
      checkingRef.current = false
      return false
    } catch {
      setUser(null)
      checkingRef.current = false
      return false
    }
  }, [user])

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
    checkLogin,
  }
}
