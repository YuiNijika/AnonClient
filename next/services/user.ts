import { api } from '@/lib/api'
import type { UserInfo } from './auth'

export const UserService = {
  getInfo: () => {
    return api.get<UserInfo>('/user/info')
  }
}

