import { useState, useCallback, useRef } from 'react'
import { useApi } from './useApi'
import { AuthApi, type LoginDTO, type UserInfo } from '../services/auth'
import { UserApi } from '../services/user'

export const useAuth = () => {
  const api = useApi()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkingRef = useRef(false)

  const login = useCallback(
    async (data: LoginDTO) => {
      setLoading(true)
      setError(null)
      try {
        const res = await AuthApi.login(api, data)
        // 设置 token
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token)
        }
        // 通过 /user/info 获取完整用户信息
        const userRes = await UserApi.getInfo(api)
        if (userRes.data) {
          setUser(userRes.data)
        }
        return res
      } catch (err) {
        // 处理认证错误
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
          setUser(null)
          localStorage.removeItem('token')
        }
        const message = err instanceof Error ? err.message : '登录失败'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [api]
  )

  const register = useCallback(
    async (data: LoginDTO) => {
      setLoading(true)
      setError(null)
      try {
        const res = await AuthApi.register(api, data)
        // 设置 token
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token)
        }
        // 直接使用返回的用户信息
        if (res.data?.user) {
          setUser(res.data.user)
        } else {
          // 如果没有返回用户信息，则通过 /user/info 获取
          const userRes = await UserApi.getInfo(api)
          if (userRes.data) {
            setUser(userRes.data)
          }
        }
        return res
      } catch (err) {
        // 处理认证错误
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
          setUser(null)
          localStorage.removeItem('token')
        }
        const message = err instanceof Error ? err.message : '注册失败'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [api]
  )

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await AuthApi.logout(api)
      localStorage.removeItem('token')
      setUser(null)
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }, [api])

  const checkLogin = useCallback(async (): Promise<boolean> => {
    if (checkingRef.current) return !!user
    checkingRef.current = true

    try {
      const res = await AuthApi.checkLogin(api)
      const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false

      if (loggedIn) {
        try {
          const configRes = await api.get<{ token?: boolean }>('/get-config')

          if (configRes.data?.token) {
            const tokenRes = await AuthApi.getToken(api)
            if (tokenRes.data?.token) {
              localStorage.setItem('token', tokenRes.data.token)
            }
          }

          const userRes = await UserApi.getInfo(api)
          if (userRes.data) {
            setUser(userRes.data)
            checkingRef.current = false
            return true
          }
        } catch {
          setUser(null)
          localStorage.removeItem('token')
          checkingRef.current = false
          return false
        }
      }

      setUser(null)
      localStorage.removeItem('token')
      checkingRef.current = false
      return false
    } catch (err) {
      console.error('Check login failed:', err)
      checkingRef.current = false
      return !!user
    }
  }, [api, user])

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
