# 前端客户端

四个前端框架的 API 封装实现，已对接后端 API。

## 项目结构

```
client/
├── vue/          # Vue 3 + Pinia
├── react/        # React + React Router 7
├── next/         # Next.js 16
└── nuxt/         # Nuxt 4 + Pinia
```

## 快速开始

```bash
# Vue
cd vue && pnpm dev

# React
cd react && pnpm dev

# Next.js
cd next && pnpm dev

# Nuxt
cd nuxt && pnpm dev
```

## API 配置

修改各框架的 API 基础 URL：

- **Vue**: `src/api/config.ts`
- **React**: `app/api/config.ts`
- **Next.js**: `api/config.ts`
- **Nuxt**: `app/composables/api/config.ts`

## 使用示例

### Vue / Nuxt

```vue
<script setup lang="ts">
const { login, logout, isLoggedIn } = useAuth()
const { getUserInfo, userInfo } = useUser()

// 登录
await login({ username: 'admin', password: 'password' })
await getUserInfo()
</script>
```

### React / Next.js

```tsx
const { login, logout, isLoggedIn } = useAuth()
const { getUserInfo, userInfo } = useUser()

// 登录
await login({ username: 'admin', password: 'password' })
await getUserInfo()
```

## API 接口

### 认证

- `POST /auth/login` - 登录
- `POST /auth/logout` - 登出
- `GET /auth/check-login` - 检查登录状态
- `GET /auth/token` - 获取 Token

### 用户

- `GET /user/info` - 获取用户信息

### 配置

- `GET /anon/common/config` - 获取配置（Token 是否启用）

## Token 验证

前端自动处理 Token 验证：

1. 应用启动时调用 `/anon/common/config` 获取配置
2. 如果启用 Token，登录后自动保存 Token
3. 后续请求自动在请求头中携带 `X-API-Token`
4. Token 缺失时自动从 `/auth/token` 获取（需已登录）

## 功能特性

- ✅ 统一的 API 客户端封装
- ✅ 自动 Token 管理
- ✅ 自动 Cookie 处理
- ✅ TypeScript 类型支持
- ✅ 统一错误处理
- ✅ 响应式状态管理
