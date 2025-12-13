# Vue 3 项目

Vue 3 + Pinia + TypeScript

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

API 基础 URL 配置在 `src/api/config.ts`

## 使用

```vue
<script setup lang="ts">
import { useAuth } from '@/stores/auth'
import { useUser } from '@/api/useUser'

const authStore = useAuthStore()
const { getUserInfo } = useUser()

// 登录
await authStore.login({ username: 'admin', password: 'password' })
</script>
```
