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
    // 防止重复请求（开发模式下可能导致重复调用）
    if (checkingRef.current) {
      return !!user
    }
    checkingRef.current = true
    try {
      const res = await AuthService.checkLogin()
      const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false
      if (loggedIn) {
        // 已登录则获取 token 和用户信息
        try {
          // 检查后端是否启用 Token
          const configRes = await api.get<{ token?: boolean }>('/get-config')
          const tokenEnabled = configRes.data?.token ?? false

          // 如果启用 Token，先检查 Token 是否变化
          if (tokenEnabled) {
            const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const tokenRes = await AuthService.getToken()
            const newToken = tokenRes.data?.token

            if (currentToken && newToken && currentToken !== newToken) {
              // Token 已变化，说明是不同后端，清除状态
              setUser(null)
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
              }
              checkingRef.current = false
              return false
            }

            // Token 未变化或没有旧 Token，继续验证用户信息
            if (user) {
              const userRes = await UserService.getInfo()
              const userInfo = userRes.data
              
              if (userInfo) {
                // 比较关键字段是否一致
                const isUserMatch = 
                  userInfo.uid === user.uid &&
                  userInfo.name === user.name &&
                  (userInfo.email || '') === (user.email || '')
                
                if (!isUserMatch) {
                  // 用户信息不一致，说明 Token 无效或用户已变化，清除状态
                  setUser(null)
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('token')
                  }
                  checkingRef.current = false
                  return false
                }
                // 用户信息一致，更新用户信息并保存 Token
                setUser(userInfo)
                if (newToken && typeof window !== 'undefined') {
                  localStorage.setItem('token', newToken)
                }
                checkingRef.current = false
                return true
              } else {
                // 获取用户信息失败，清除状态
                setUser(null)
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('token')
                }
                checkingRef.current = false
                return false
              }
            } else {
              // 本地没有用户信息，直接获取用户信息和 Token
              if (newToken && typeof window !== 'undefined') {
                localStorage.setItem('token', newToken)
              }
              const userRes = await UserService.getInfo()
              if (userRes.data) {
                setUser(userRes.data)
                checkingRef.current = false
                return true
              }
              // 获取用户信息失败，清除状态
              setUser(null)
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
              }
              checkingRef.current = false
              return false
            }
          } else {
            // 不启用 Token，直接获取用户信息
            const tokenRes = await AuthService.getToken()
            if (tokenRes.data?.token && typeof window !== 'undefined') {
              localStorage.setItem('token', tokenRes.data.token)
            }
            const userRes = await UserService.getInfo()
            if (userRes.data) {
              setUser(userRes.data)
              checkingRef.current = false
              return true
            }
            // 获取用户信息失败，清除状态
            setUser(null)
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token')
            }
            checkingRef.current = false
            return false
          }
        } catch (err) {
          // Token 或用户信息获取失败，说明后端状态异常，清除所有状态
          setUser(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
          }
          checkingRef.current = false
          return false
        }
      }
      // Session 已过期，清除所有状态
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      checkingRef.current = false
      return false
    } catch {
      // 网络错误或其他错误，不清空状态，等待重试
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
