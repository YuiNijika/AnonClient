/**
 * Nuxt 类型声明
 */

declare global {
  namespace NodeJS {
    interface Process {
      client: boolean
      server: boolean
    }
  }
  
  const process: NodeJS.Process
}

// ImportMeta 类型扩展
interface ImportMeta {
  readonly client: boolean
  readonly server: boolean
}

export {}
