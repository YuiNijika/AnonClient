/**
 * Pinia 持久化插件配置
 */

import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$pinia.use(createPersistedState())
})
