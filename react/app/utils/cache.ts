/**
 * 内存缓存工具
 */

interface CacheItem<T> {
  value: T
  expireTime: number
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map()

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, duration: number): void {
    const expireTime = Date.now() + duration
    this.cache.set(key, { value, expireTime })
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expireTime) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) {
      return false
    }

    if (Date.now() > item.expireTime) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

// 导出单例
export const memoryCache = new MemoryCache()

// 缓存配置
export const CACHE_CONFIG = {
  USER_CACHE_DURATION: 5 * 60 * 1000 // 5分钟缓存
} as const

