import type { useApi } from '@/hooks/useApi'
import type { UserInfo } from './auth'

type ApiClient = ReturnType<typeof useApi>

export const UserApi = {
  getInfo: (api: ApiClient) => {
    return api.get<UserInfo>('/user/info')
  }
}

