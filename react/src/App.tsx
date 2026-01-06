import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import './App.css'

function App() {
  const auth = useAuth()
  const [showLogin, setShowLogin] = useState(true)
  const [mounted, setMounted] = useState(false)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // 防止重复请求（StrictMode 会导致重复调用）
    if (hasCheckedRef.current) {
      return
    }
    hasCheckedRef.current = true
    auth.checkLogin().then(() => {
      setMounted(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (auth.isAuthenticated) {
      setMounted(true)
    }
  }, [auth.isAuthenticated])

  return (
    <div className="container">
      {mounted && (
        <>
          {auth.isAuthenticated ? (
            <div className="welcome">
              <h1>欢迎回来！</h1>
              <p>用户：{auth.user?.name}</p>
              <p>UID：{auth.user?.uid}</p>
              <button onClick={auth.logout}>退出登录</button>
            </div>
          ) : (
            <div className="form-container">
              <h1>{showLogin ? '登录' : '注册'}</h1>
              {showLogin ? (
                <LoginForm onSwitch={() => setShowLogin(false)} />
              ) : (
                <RegisterForm onSwitch={() => setShowLogin(true)} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
