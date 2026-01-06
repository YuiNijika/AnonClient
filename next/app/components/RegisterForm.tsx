'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useAuth, useCaptcha } from '@/hooks'

interface RegisterFormProps {
  onSwitch: () => void
}

export default function RegisterForm({ onSwitch }: RegisterFormProps) {
  const auth = useAuth()
  const captcha = useCaptcha()
  const [form, setForm] = useState({ username: '', password: '', email: '', captcha: '', rememberMe: false })

  useEffect(() => {
    captcha.check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await auth.register(form)
    } catch {
      if (captcha.enabled) await captcha.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <input
        type="text"
        placeholder="用户名"
        required
        disabled={auth.loading}
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <input
        type="email"
        placeholder="邮箱"
        required
        disabled={auth.loading}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="密码"
        required
        disabled={auth.loading}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {captcha.enabled && (
        <div className="captcha">
          <input
            type="text"
            placeholder="验证码"
            required
            disabled={auth.loading}
            value={form.captcha}
            onChange={(e) => setForm({ ...form, captcha: e.target.value })}
          />
          {captcha.image && <img src={captcha.image} onClick={captcha.refresh} alt="验证码" />}
        </div>
      )}
      <label>
        <input
          type="checkbox"
          checked={form.rememberMe}
          disabled={auth.loading}
          onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
        />{' '}
        记住我
      </label>
      {auth.error && <div className="error">{auth.error}</div>}
      <button type="submit" disabled={auth.loading}>
        {auth.loading ? '注册中...' : '注册'}
      </button>
      <div className="link">
        <span>已有账号？</span>
        <a onClick={onSwitch}>立即登录</a>
      </div>
    </form>
  )
}

