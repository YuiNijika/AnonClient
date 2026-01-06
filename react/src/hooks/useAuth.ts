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
    // 防止重复请求（StrictMode 会导致重复调用）
    if (checkingRef.current) {
      return !!user
    }
    checkingRef.current = true
    try {
      const res = await AuthApi.checkLogin(api)
      const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false

      if (loggedIn) {
        // 已登录则获取 token 和用户信息
        try {
          // 检查后端是否启用 Token
          const configRes = await api.get<{ token?: boolean }>('/get-config')
          const tokenEnabled = configRes.data?.token ?? false

          // 如果启用 Token，先检查 Token 是否变化
          if (tokenEnabled) {
            const currentToken = localStorage.getItem('token')
            const tokenRes = await AuthApi.getToken(api)
            const newToken = tokenRes.data?.token

            if (currentToken && newToken && currentToken !== newToken) {
              // Token 已变化，说明是不同后端，清除状态
              setUser(null)
              localStorage.removeItem('token')
              checkingRef.current = false
              return false
            }

            // Token 未变化或没有旧 Token，继续验证用户信息
            if (user) {
              const userRes = await UserApi.getInfo(api)
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
                  localStorage.removeItem('token')
                  checkingRef.current = false
                  return false
                }
                // 用户信息一致，更新用户信息并保存 Token
                setUser(userInfo)
                if (newToken) {
                  localStorage.setItem('token', newToken)
                }
                checkingRef.current = false
                return true
              } else {
                // 获取用户信息失败，清除状态
                setUser(null)
                localStorage.removeItem('token')
                checkingRef.current = false
                return false
              }
            } else {
              // 本地没有用户信息，直接获取用户信息和 Token
              if (newToken) {
                localStorage.setItem('token', newToken)
              }
              const userRes = await UserApi.getInfo(api)
              if (userRes.data) {
                setUser(userRes.data)
                checkingRef.current = false
                return true
              }
              // 获取用户信息失败，清除状态
              setUser(null)
              localStorage.removeItem('token')
              checkingRef.current = false
              return false
            }
          } else {
            // 不启用 Token，直接获取用户信息
            const tokenRes = await AuthApi.getToken(api)
            if (tokenRes.data?.token) {
              localStorage.setItem('token', tokenRes.data.token)
            }
            const userRes = await UserApi.getInfo(api)
            if (userRes.data) {
              setUser(userRes.data)
              checkingRef.current = false
              return true
            }
            // 获取用户信息失败，清除状态
            setUser(null)
            localStorage.removeItem('token')
            checkingRef.current = false
            return false
          }
        } catch (err) {
          // Token 或用户信息获取失败，说明后端状态异常，清除所有状态
          setUser(null)
          localStorage.removeItem('token')
          checkingRef.current = false
          return false
        }
      }
      // Session 已过期或后端重新安装，清除所有状态
      setUser(null)
      localStorage.removeItem('token')
      checkingRef.current = false
      return false
    } catch {
      // 网络错误时后端可能无法访问，可能是后端重新安装或网络问题
      // 为了安全清除所有状态，强制用户重新登录
      setUser(null)
      localStorage.removeItem('token')
      checkingRef.current = false
      return false
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
