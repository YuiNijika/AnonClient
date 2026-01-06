# Anon 前端框架 API 对接

本项目包含四个前端框架的 API 对接实现：

- Vue 3 (Composition API + Pinia)
- Nuxt.js 3 (Pinia)
- React 18
- Next.js 14

## 开发规范

### 通用规范

1. **逻辑封装**：所有 API 请求逻辑都封装在 composables/hooks 中
2. **组件简化**：Vue 组件不写 script，仅调用 composables
3. **状态管理**：Vue 和 Nuxt 使用 Pinia 管理登录状态，支持持久化
4. **环境配置**：
   - 开发环境：代理到 `/anon-dev-server/`
   - 生产环境：使用 `baseUrl` 环境变量

### Vue 3

**目录结构：**

```
vue/
├── src/
│   ├── composables/
│   │   ├── useApi.ts      # API 基础封装
│   │   ├── useAuth.ts     # 认证相关（使用 Pinia store）
│   │   ├── useCaptcha.ts  # 验证码相关
│   │   └── index.ts       # 统一导出
│   ├── stores/
│   │   └── auth.ts        # Pinia 认证 store（持久化）
│   └── views/
│       └── Login.vue      # 示例页面（无 script）
```

**使用示例：**

```vue
<template>
  <div>
    <button @click="handleLogin">登录</button>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables'

const { login, loading, error, user, isAuthenticated } = useAuth()

const handleLogin = async () => {
  await login({ username: 'test', password: '123456' })
}
</script>
```

**配置：**

- Pinia 持久化：已配置 `pinia-plugin-persistedstate`，登录状态自动保存到 localStorage
- 开发代理：`vite.config.ts` 中配置 `/anon-dev-server` 代理
- 生产环境：设置 `VITE_API_BASE_URL` 环境变量

### Nuxt.js 3

**目录结构：**

```
nuxt/
├── composables/
│   ├── useApi.ts
│   ├── useAuth.ts         # 使用 Pinia store
│   └── useCaptcha.ts
├── stores/
│   └── auth.ts            # Pinia 认证 store（持久化）
└── plugins/
    └── pinia-persistedstate.client.ts  # 持久化插件配置
```

**使用示例：**

```vue
<template>
  <div>
    <button @click="handleLogin">登录</button>
  </div>
</template>

<script setup lang="ts">
const { login, loading, error, user, isAuthenticated } = useAuth()

const handleLogin = async () => {
  await login({ username: 'test', password: '123456' })
}
</script>
```

**配置：**

- Pinia 模块：已配置 `@pinia/nuxt` 和 `pinia-plugin-persistedstate`
- 持久化：登录状态自动保存到 localStorage
- 开发代理：`nuxt.config.ts` 中配置 Vite proxy
- 生产环境：设置 `NUXT_PUBLIC_API_BASE_URL` 环境变量

### React 18

**目录结构：**

```
react/
├── src/
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── useAuth.ts
│   │   ├── useCaptcha.ts
│   │   └── index.ts
```

**使用示例：**

```tsx
import { useAuth } from '@/hooks'

function LoginPage() {
  const { login, loading, error, user, isAuthenticated } = useAuth()
  
  const handleLogin = async () => {
    await login({ username: 'test', password: '123456' })
  }
  
  return <button onClick={handleLogin}>登录</button>
}
```

**配置：**

- 开发代理：`vite.config.ts` 中配置 `/anon-dev-server` 代理
- 生产环境：设置 `VITE_API_BASE_URL` 环境变量

### Next.js 14

**目录结构：**

```
next/
├── lib/
│   └── api.ts           # API 基础封装
├── hooks/
│   ├── useAuth.ts
│   ├── useCaptcha.ts
│   └── index.ts
```

**使用示例：**

```tsx
'use client'

import { useAuth } from '@/hooks'

export default function LoginPage() {
  const { login, loading, error, user, isAuthenticated } = useAuth()
  
  const handleLogin = async () => {
    await login({ username: 'test', password: '123456' })
  }
  
  return <button onClick={handleLogin}>登录</button>
}
```

**配置：**

- 开发代理：`next.config.ts` 中配置 rewrites
- 生产环境：设置 `NEXT_PUBLIC_API_BASE_URL` 环境变量

## Pinia 状态管理（Vue & Nuxt）

### 认证 Store

登录状态通过 Pinia store 管理，支持持久化：

```typescript
// 使用 store
const authStore = useAuthStore()

// 访问状态
authStore.user
authStore.isAuthenticated
authStore.loading
authStore.error

// 调用方法
await authStore.login({ username: 'test', password: '123456' })
await authStore.logout()
await authStore.checkLogin()
```

### 持久化配置

- **Vue**: 使用 `pinia-plugin-persistedstate`，状态保存到 localStorage
- **Nuxt**: 使用 `pinia-plugin-persistedstate`，状态保存到 localStorage

持久化的数据：

- `user`: 用户信息
- `token`: 认证令牌（Vue 中同时保存到 localStorage）

## API 端点

### 认证相关

- `POST /auth/login` - 登录
- `POST /auth/logout` - 退出
- `POST /auth/register` - 注册
- `GET /auth/token` - 获取 Token
- `GET /auth/check-login` - 检查登录状态
- `GET /auth/captcha` - 获取验证码

### 用户相关

- `GET /user/info` - 获取用户信息

### 配置相关

- `GET /anon/common/config` - 获取配置（验证码开关等）

## 环境变量

### Vue / React

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Nuxt.js

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Next.js

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 开发环境代理

所有框架在开发环境下都会将 `/anon-dev-server/*` 代理到 `http://localhost:8000/*`。

## Token 管理

- **Vue**: Token 存储在 Pinia store 和 localStorage（双重存储）
- **Nuxt**: Token 存储在 Pinia store 和 Cookie（使用 `useCookie`）
- **React/Next.js**: Token 存储在 localStorage
- 请求时自动在 `X-API-Token` header 中携带
- 登录成功后自动保存 Token

## 安装依赖

### Vue

```bash
cd client/vue
pnpm install
```

### Nuxt

```bash
cd client/nuxt
pnpm install
```

### React

```bash
cd client/react
pnpm install
```

### Next.js

```bash
cd client/next
pnpm install
```
