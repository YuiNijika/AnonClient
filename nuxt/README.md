# Nuxt 4 项目

Nuxt 4 + Pinia + TypeScript

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

API 基础 URL 配置在 `app/composables/api/config.ts`

## 使用

```vue
<script setup lang="ts">
const { login, logout, isLoggedIn } = useAuth()
const { getUserInfo, userInfo } = useUser()

// 登录
await login({ username: 'admin', password: 'password' })
</script>
```
