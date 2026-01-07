'use client'

import { useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { AuthService, type LoginDTO, type UserInfo } from '@/services/auth'
import { UserService } from '@/services/user'

export const useAuth = () => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkingRef = useRef(false)

  const login = useCallback(async (data: LoginDTO) => {
    setLoading(true)
    setError(null)
    try {
      const res = await AuthService.login(data)
      // 设置 token
      if (res.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.token)
      }
      // 通过 /user/info 获取完整用户信息
      const userRes = await UserService.getInfo()
      if (userRes.data) {
        setUser(userRes.data)
      }
      return res
    } catch (err) {
      // 处理认证错误
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
        setUser(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      }
      const message = err instanceof Error ? err.message : '登录失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: LoginDTO) => {
    setLoading(true)
    setError(null)
    try {
      const res = await AuthService.register(data)
      // 设置 token
      if (res.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.token)
      }
      // 直接使用返回的用户信息
      if (res.data?.user) {
        setUser(res.data.user)
      } else {
        // 如果没有返回用户信息，则通过 /user/info 获取
        const userRes = await UserService.getInfo()
        if (userRes.data) {
          setUser(userRes.data)
        }
      }
      return res
    } catch (err) {
      // 处理认证错误
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
        setUser(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      }
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
      await AuthService.logout()
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
    if (checkingRef.current) return !!user
    checkingRef.current = true

    try {
      const res = await AuthService.checkLogin()
      const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false

      if (loggedIn) {
        try {
          const configRes = await api.get<{ token?: boolean }>('/get-config')
          
          if (configRes.data?.token) {
            const tokenRes = await AuthService.getToken()
            if (tokenRes.data?.token && typeof window !== 'undefined') {
              localStorage.setItem('token', tokenRes.data.token)
            }
          }

          const userRes = await UserService.getInfo()
          if (userRes.data) {
            setUser(userRes.data)
            checkingRef.current = false
            return true
          }
        } catch {
          setUser(null)
          if (typeof window !== 'undefined') localStorage.removeItem('token')
          checkingRef.current = false
          return false
        }
      }

      setUser(null)
      if (typeof window !== 'undefined') localStorage.removeItem('token')
      checkingRef.current = false
      return false
    } catch (err) {
      console.error('Check login failed:', err)
      checkingRef.current = false
      return !!user
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
