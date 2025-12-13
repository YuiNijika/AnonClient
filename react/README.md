# React 项目

React + React Router 7 + TypeScript

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

API 基础 URL 配置在 `app/api/config.ts`

## 使用

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'

function MyComponent() {
  const { login, logout, isLoggedIn } = useAuth()
  const { getUserInfo, userInfo } = useUser()

  // 登录
  await login({ username: 'admin', password: 'password' })
}
```
