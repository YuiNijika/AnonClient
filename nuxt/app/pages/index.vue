<script setup lang="ts">
const auth = useAuth()
const showLogin = ref(true)
const mounted = ref(false)

onMounted(async () => {
  await auth.checkLogin()
  mounted.value = true
})

watch(() => auth.isAuthenticated, (isAuth) => {
  if (isAuth) {
    mounted.value = true
  }
})
</script>

<template>
  <div class="container">
    <div v-if="mounted">
      <div v-if="auth.isAuthenticated" class="welcome">
        <h1>欢迎回来！</h1>
        <p>用户：{{ auth.user?.name }}</p>
        <p>UID：{{ auth.user?.uid }}</p>
        <button @click="auth.logout">退出登录</button>
      </div>
      <div v-else class="form-container">
        <h1>{{ showLogin ? '登录' : '注册' }}</h1>
        <LoginForm v-if="showLogin" @switch="showLogin = false" />
        <RegisterForm v-else @switch="showLogin = true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.welcome { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; }
.welcome h1 { margin: 0 0 20px 0; color: #333; }
.welcome p { margin: 10px 0; color: #666; }
.form-container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; }
.form-container h1 { margin: 0 0 30px 0; text-align: center; color: #333; }
button { background: #6c757d; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
button:hover { background: #5a6268; }
</style>
