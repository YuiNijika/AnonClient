# Next.js 16 项目

Next.js 16 + TypeScript

## 安装依赖

```bash
pnpm install
```

## 开发

```bash
pnpm dev
```

## 构建

```bash
pnpm build
```

## 配置

API 基础 URL 配置在 `api/config.ts`

## 使用

```tsx
'use client'

import { useAuth } from '@/api/useAuth'
import { useUser } from '@/api/useUser'

export default function Page() {
  const { login, logout, isLoggedIn } = useAuth()
  const { getUserInfo, userInfo } = useUser()

  // 登录
  await login({ username: 'admin', password: 'password' })
}
```
