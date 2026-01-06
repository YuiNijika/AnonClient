<script setup lang="ts">
const auth = useAuth()
const captcha = useCaptcha()
const form = reactive({ username: '', password: '', email: '', captcha: '', rememberMe: false })
const emit = defineEmits<{ switch: [] }>()

const submit = async () => {
  try {
    await auth.register(form)
  } catch {
    if (captcha.enabled.value) await captcha.refresh()
  }
}

onMounted(() => {
  if (import.meta.client) {
    captcha.check()
  }
})
</script>

<template>
  <form @submit.prevent="submit" class="form">
    <input v-model="form.username" type="text" placeholder="用户名" required :disabled="auth.loading" />
    <input v-model="form.email" type="email" placeholder="邮箱" required :disabled="auth.loading" />
    <input v-model="form.password" type="password" placeholder="密码" required :disabled="auth.loading" />
    <div v-if="captcha.enabled.value" class="captcha">
      <input v-model="form.captcha" type="text" placeholder="验证码" required :disabled="auth.loading" />
      <img v-if="captcha.image.value" :src="captcha.image.value" @click="captcha.refresh" alt="验证码" />
    </div>
    <label><input v-model="form.rememberMe" type="checkbox" :disabled="auth.loading" /> 记住我</label>
    <div v-if="auth.error" class="error">{{ auth.error }}</div>
    <button type="submit" :disabled="auth.loading">{{ auth.loading ? '注册中...' : '注册' }}</button>
    <div class="link"><span>已有账号？</span><a @click="emit('switch')">立即登录</a></div>
  </form>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 15px; }
.form input { padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
.form input:focus { outline: none; border-color: #667eea; }
.form input:disabled { background: #f5f5f5; cursor: not-allowed; }
.captcha { display: flex; gap: 10px; }
.captcha input { flex: 1; }
.captcha img { width: 120px; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; }
.error { padding: 12px; background: #fee; border: 1px solid #fcc; border-radius: 6px; color: #c33; }
button { background: #667eea; color: white; padding: 12px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
button:hover:not(:disabled) { background: #5568d3; }
button:disabled { background: #ccc; cursor: not-allowed; }
.link { text-align: center; color: #666; font-size: 14px; }
.link a { color: #667eea; text-decoration: none; margin-left: 5px; cursor: pointer; }
</style>
