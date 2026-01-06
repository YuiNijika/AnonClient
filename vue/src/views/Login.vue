<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useAuth, useCaptcha } from '@/composables'

const auth = useAuth()
const captcha = useCaptcha()
const form = reactive({ username: '', password: '', captcha: '', rememberMe: false })

const submit = async () => {
    try {
        await auth.login(form)
    } catch {
        if (captcha.enabled.value) await captcha.refresh()
    }
}

onMounted(() => captcha.check())
</script>

<template>
    <div class="container">
        <div v-if="auth.isAuthenticated" class="welcome">
            <h1>欢迎回来！</h1>
            <p>用户：{{ auth.user?.name }}</p>
            <button @click="auth.logout">退出登录</button>
        </div>
        <form v-else @submit.prevent="submit" class="form">
            <h1>登录</h1>
            <input v-model="form.username" type="text" placeholder="用户名" required :disabled="auth.loading" />
            <input v-model="form.password" type="password" placeholder="密码" required :disabled="auth.loading" />
            <div v-if="captcha.enabled.value" class="captcha">
                <input v-model="form.captcha" type="text" placeholder="验证码" required :disabled="auth.loading" />
                <img :src="captcha.image.value" @click="captcha.refresh" alt="验证码" />
            </div>
            <label><input v-model="form.rememberMe" type="checkbox" :disabled="auth.loading" /> 记住我</label>
            <div v-if="auth.error" class="error">{{ auth.error }}</div>
            <button type="submit" :disabled="auth.loading">{{ auth.loading ? '登录中...' : '登录' }}</button>
        </form>
    </div>
</template>

<style scoped>
.container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.welcome {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 400px;
}

.welcome h1 {
    margin: 0 0 20px 0;
    color: #333;
}

.form {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.form h1 {
    margin: 0 0 20px 0;
    text-align: center;
    color: #333;
}

.form input {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
}

.form input:focus {
    outline: none;
    border-color: #667eea;
}

.form input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.captcha {
    display: flex;
    gap: 10px;
}

.captcha input {
    flex: 1;
}

.captcha img {
    width: 120px;
    height: 40px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
}

.error {
    padding: 12px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 6px;
    color: #c33;
}

button {
    background: #667eea;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
}

button:hover:not(:disabled) {
    background: #5568d3;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>
