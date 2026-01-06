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
const fetchUserInfo = async (api: ReturnType<typeof useApi>) => {
  try {
    const userRes = await api.get<UserInfo>('/user/info')
    return userRes.data || null
  } catch {
    return null
  }
}

// 封装获取 token 的通用逻辑
const fetchToken = async (api: ReturnType<typeof useApi>) => {
  try {
    const tokenRes = await api.get<TokenResponse>('/auth/token')
    return tokenRes.data?.token || null
  } catch {
    return null
  }
}

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
    async login(data: Record<string, any>) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<LoginResponse>('/auth/login', data)
        // 设置 token
        if (res.data?.token) {
          useCookie('token').value = res.data.token
        }
        // 等待 token 设置完成后再获取用户信息
        await nextTick()
        // 通过 /user/info 获取完整用户信息
        const userInfo = await fetchUserInfo(api)
        if (userInfo) {
          this.user = userInfo
        }
        return res
      } catch (err) {
        this.error = err instanceof Error ? err.message : '登录失败'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(data: Record<string, any>) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<LoginResponse>('/auth/register', data)
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
          const userInfo = await fetchUserInfo(api)
          if (userInfo) {
            this.user = userInfo
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
        const { post } = useApi()
        await post('/auth/logout')
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
        const res = await api.get<CheckLoginResponse>('/auth/check-login')
        const loggedIn = res.data?.loggedIn ?? res.data?.logged_in ?? false
        if (loggedIn) {
          // 已登录则获取 token 和用户信息
          const token = await fetchToken(api)
          if (token) {
            useCookie('token').value = token
          }
          const userInfo = await fetchUserInfo(api)
          if (userInfo) {
            this.user = userInfo
            return true
          }
        }
        this.user = null
        return false
      } catch {
        this.user = null
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
