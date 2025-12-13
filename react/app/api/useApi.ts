/**
 * API 统一导出
 * 为了保持向后兼容，保留此文件
 */

// 重新导出核心 API 服务
export { apiService as apiClient } from './core'

// 重新导出配置
export { API_ENDPOINTS } from './config'

// 重新导出类型
export type { ApiResponse, RequestOptions } from './types'

