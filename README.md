# 前端客户端 API 对接说明

本项目包含四个前端框架的 API 封装实现，所有框架都已对接后端 API，采用类似 Vue Composables 的模式进行封装。

## 项目结构

```
client/
├── vue/          # Vue 3 + Pinia + Vue Router
├── react/        # React + React Router 7
├── next/         # Next.js 16
└── nuxt/         # Nuxt 4 + Pinia
```

## API 配置

每个框架的 API 基础 URL 都配置在各自的配置文件中，可以随时修改：

- **Vue**: `src/config/api.ts` - 修改 `baseurl` 常量
- **React**: `app/lib/api.ts` - 修改 `baseurl` 常量
- **Next.js**: `lib/api.ts` - 修改 `baseurl` 常量
- **Nuxt**: `composables/useApi.ts` - 修改 `baseurl` 常量

## 后端 API 接口

### 认证相关

- `POST /auth/login` - 用户登录
  - 请求体: `{ username: string, password: string, rememberMe?: boolean }`
  - 响应: `{ success: boolean, message: string, data: { user_id, username, email } }`

- `POST /auth/logout` - 用户登出
  - 响应: `{ success: boolean, message: string }`

- `GET /auth/check-login` - 检查登录状态
  - 响应: `{ success: boolean, message: string, data: { logged_in: boolean } }`

### 用户相关

- `GET /user/info` - 获取用户信息（需登录）
  - 响应: `{ success: boolean, message: string, data: { uid, name, email, ... } }`

## 使用方式

### Vue 3

```vue
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { useUser } from '@/composables/useUser'

const { login, logout, checkLogin, isLoggedIn, isLoading, error } = useAuth()
const { getUserInfo, userInfo } = useUser()

// 登录
const handleLogin = async () => {
  try {
    await login({ username: 'admin', password: 'password' })
    await getUserInfo()
  } catch (err) {
    console.error('登录失败:', err)
  }
}

// 登出
const handleLogout = async () => {
  try {
    await logout()
  } catch (err) {
    console.error('登出失败:', err)
  }
}
</script>
```

### React

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'

function MyComponent() {
  const { login, logout, checkLogin, isLoggedIn, isLoading, error } = useAuth()
  const { getUserInfo, userInfo } = useUser()

  const handleLogin = async () => {
    try {
      await login({ username: 'admin', password: 'password' })
      await getUserInfo()
    } catch (err) {
      console.error('登录失败:', err)
    }
  }

  return (
    <div>
      {isLoggedIn ? (
        <button onClick={logout}>登出</button>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
    </div>
  )
}
```

### Next.js

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'

export default function Page() {
  const { login, logout, isLoggedIn } = useAuth()
  const { getUserInfo, userInfo } = useUser()
  
  // 使用方式同 React
}
```

### Nuxt 4

```vue
<script setup lang="ts">
const { login, logout, checkLogin, isLoggedIn } = useAuth()
const { getUserInfo, userInfo } = useUser()

// 使用方式同 Vue 3
</script>
```

## 功能特性

- ✅ 统一的 API 客户端封装
- ✅ 自动处理 Cookie（credentials: 'include'）
- ✅ 完整的 TypeScript 类型支持
- ✅ 统一的错误处理
- ✅ 响应式状态管理
- ✅ 加载状态管理

## 测试

每个框架的 app 文件都已包含登录/登出测试界面，可以直接运行项目进行测试：

```bash
# Vue
cd client/vue
pnpm dev

# React
cd client/react
pnpm dev

# Next.js
cd client/next
pnpm dev

# Nuxt
cd client/nuxt
pnpm dev
```

## Token 验证自动化处理

后端提供了配置接口 `/anon/common/config`，前端可以在应用启动时获取配置，自动决定是否启用 Token 验证：

```typescript
// 1. 获取配置
const configRes = await fetch('http://localhost:8080/anon/common/config');
const { data: config } = await configRes.json();
const tokenEnabled = config.token; // true/false

// 2. 如果启用 Token，在请求头中自动携带
if (tokenEnabled && token) {
  headers['X-API-Token'] = token;
}
```

### 登录流程

1. 调用 `/anon/common/config` 获取 Token 配置
2. 调用 `/auth/login` 登录（登录路由已在白名单中，无需 Token）
3. 登录成功后保存返回的 `token` 字段
4. 后续请求自动在请求头中携带 `X-API-Token`

### Token 存储

- 建议使用 `localStorage` 或 `sessionStorage` 存储 Token
- 登录成功后保存：`localStorage.setItem('token', token)`
- 登出后清除：`localStorage.removeItem('token')`

## 注意事项

1. 确保后端服务已启动（默认 `http://anon.localhost:8080`）
2. 如果后端运行在不同端口，请修改对应框架的 `baseurl` 配置
3. 所有 API 请求都会自动携带 Cookie，用于 Session 认证
4. 登录后会自动设置 Cookie，登出会清除 Cookie
5. 如果后端启用了 Token 验证，登录后需要在请求头中携带 `X-API-Token`
6. 登录、登出、检查登录状态等路由已在 Token 白名单中，无需携带 Token
