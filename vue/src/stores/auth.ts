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
          localStorage.setItem('token', res.data.token)
        }
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
          localStorage.setItem('token', res.data.token)
        }
        // 直接使用返回的用户信息
        if (res.data?.user) {
          this.user = res.data.user
        } else {
          // 如果没有返回用户信息，则通过 /user/info 获取
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
        localStorage.removeItem('token')
        this.user = null
      } catch {
        // 静默失败
      } finally {
        this.loading = false
      }
    },

    async checkLogin(): Promise<boolean> {
      try {
        const api = useApi()
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
              this.user = userRes.data
              return true
            }
          } catch {
            this.user = null
            localStorage.removeItem('token')
            return false
          }
        }

        this.user = null
        localStorage.removeItem('token')
        return false
      } catch (err) {
        console.error('Check login failed:', err)
        return !!this.user
      }
    },
  },

  persist: {
    key: 'auth-store',
    storage: localStorage,
    paths: ['user'],
  },
})
