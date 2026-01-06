import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { AuthApi, type LoginDTO, type UserInfo } from '@/services/auth'
import { UserApi } from '@/services/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserInfo | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async login(data: LoginDTO) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        const res = await AuthApi.login(api, data)
        // 设置 token
        if (res.data?.token) {
          useCookie('token').value = res.data.token
        }
        // 等待 token 设置完成后再获取用户信息
        await nextTick()
        // 通过 /user/info 获取完整用户信息
        const userRes = await UserApi.getInfo(api)
        if (userRes.data) {
          this.user = userRes.data
        }
        return res
      } catch (err) {
        this.error = err instanceof Error ? err.message : '登录失败'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(data: LoginDTO) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        const res = await AuthApi.register(api, data)
        // 设置 token
        if (res.data?.token) {
          useCookie('token').value = res.data.token
        }
        // 直接使用返回的用户信息
        if (res.data?.user) {
          this.user = res.data.user
        } else {
          // 如果没有返回用户信息，则通过 /user/info 获取
          await nextTick()
          const userRes = await UserApi.getInfo(api)
          if (userRes.data) {
            this.user = userRes.data
          }
        }
        return res
      } catch (err) {
        this.error = err instanceof Error ? err.message : '注册失败'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        const api = useApi()
        await AuthApi.logout(api)
        useCookie('token').value = null
        this.user = null
      } catch {
        // 静默失败
      } finally {
        this.loading = false
      }
    },

    async checkLogin(): Promise<boolean> {
      if (!import.meta.client) return false
      try {
        const api = useApi()
        const res = await AuthApi.checkLogin(api)
        const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false
        
        if (loggedIn) {
          try {
            // 检查后端是否启用 Token
            const configRes = await api.get<{ token?: boolean }>('/get-config')
            const tokenEnabled = configRes.data?.token ?? false

            // 如果启用 Token，先检查 Token 是否变化
            if (tokenEnabled) {
              const currentToken = useCookie('token').value
              const tokenRes = await AuthApi.getToken(api)
              const newToken = tokenRes.data?.token

              if (currentToken && newToken && currentToken !== newToken) {
                // Token 已变化，说明是不同后端，清除状态
                this.user = null
                useCookie('token').value = null
                return false
              }

              // Token 未变化或没有旧 Token，继续验证用户信息
              if (this.user) {
                const userRes = await UserApi.getInfo(api)
                const userInfo = userRes.data
                
                if (userInfo) {
                  // 比较关键字段是否一致
                  const isUserMatch =
                    userInfo.uid === this.user.uid &&
                    userInfo.name === this.user.name &&
                    (userInfo.email || '') === (this.user.email || '')

                  if (!isUserMatch) {
                    // 用户信息不一致，说明 Token 无效或用户已变化，清除状态
                    this.user = null
                    useCookie('token').value = null
                    return false
                  }
                  // 用户信息一致，更新用户信息并保存 Token
                  this.user = userInfo
                  if (newToken) {
                    useCookie('token').value = newToken
                  }
                  return true
                } else {
                  // 获取用户信息失败，清除状态
                  this.user = null
                  useCookie('token').value = null
                  return false
                }
              } else {
                // 本地没有用户信息，直接获取用户信息和 Token
                if (newToken) {
                  useCookie('token').value = newToken
                }
                const userRes = await UserApi.getInfo(api)
                if (userRes.data) {
                  this.user = userRes.data
                  return true
                }
                // 获取用户信息失败，清除状态
                this.user = null
                useCookie('token').value = null
                return false
              }
            } else {
              // 不启用 Token，直接获取用户信息
              const tokenRes = await AuthApi.getToken(api)
              if (tokenRes.data?.token) {
                useCookie('token').value = tokenRes.data.token
              }
              const userRes = await UserApi.getInfo(api)
              if (userRes.data) {
                this.user = userRes.data
                return true
              }
              // 获取用户信息失败，清除状态
              this.user = null
              useCookie('token').value = null
              return false
            }
          } catch (err) {
            // Token 或用户信息获取失败，说明后端状态异常，清除所有状态
            this.user = null
            useCookie('token').value = null
            return false
          }
        }
        // Session 已过期或后端重新安装，清除所有状态
        this.user = null
        useCookie('token').value = null
        return false
      } catch {
        // 网络错误时后端可能无法访问，可能是后端重新安装或网络问题
        // 为了安全清除所有状态，强制用户重新登录
        this.user = null
        useCookie('token').value = null
        return false
      }
    },
  },

  persist: {
    key: 'auth-store',
    storage: import.meta.client ? localStorage : undefined,
    paths: ['user'],
  } as any,
})
