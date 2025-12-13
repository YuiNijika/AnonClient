import type { Route } from "./+types/home";
import { useState, useEffect } from "react";
import { useAuth } from "../api/useAuth";
import { useUser } from "../api/useUser";
import { useCaptcha } from "../api/useCaptcha";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "React API 测试" },
    { name: "description", content: "React API 测试页面" },
  ];
}

export default function Home() {
  const { login, logout, checkLogin, isLoggedIn, isLoading, error, clearError } = useAuth();
  const { getUserInfo, userInfo, clearUserInfo } = useUser();
  const { captchaImage, autoInit, refreshCaptcha, isLoading: captchaLoading } = useCaptcha();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [fetchingUserInfo, setFetchingUserInfo] = useState(false);
  const [apiService, setApiService] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { apiService: service } = await import('../api/core');
        const { getStoredToken } = await import('../utils/storage');
        
        setApiService(service);
        await service.initConfig();
        
        const token = getStoredToken();
        if (token) {
          service.setToken(token);
        }
        
        await checkLogin();
        
        // 如果启用验证码，自动初始化
        if (service.isCaptchaEnabled()) {
          await autoInit();
        }
      } catch (err) {
        console.error('应用初始化失败:', err);
      }
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({
        username,
        password,
        rememberMe,
        ...(apiService?.isCaptchaEnabled() ? { captcha } : {}),
      });
      // 登录成功后刷新验证码
      if (apiService?.isCaptchaEnabled()) {
        setCaptcha('');
        await refreshCaptcha();
      }
      // 登录成功后，等待一下再获取用户信息，确保 Cookie 已设置
      // 注意：浏览器需要时间来处理 Set-Cookie 响应头
      setTimeout(async () => {
        try {
          // 先检查登录状态，确保 Cookie 已设置
          const loggedIn = await checkLogin();
          if (loggedIn) {
            // 登录状态确认后，再获取用户信息
            await getUserInfo();
          }
        } catch (err) {
          console.error("登录后获取信息失败:", err);
        }
      }, 500);
    } catch (err) {
      console.error("登录失败:", err);
      // 如果是验证码错误，自动刷新验证码
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (apiService?.isCaptchaEnabled() && (errorMessage.includes('验证码') || errorMessage.includes('captcha'))) {
        setCaptcha('');
        await refreshCaptcha();
      }
    }
  };

  const handleLogout = async () => {
    clearError();
    try {
      await logout();
      clearUserInfo();
    } catch (err) {
      console.error("登出失败:", err);
    }
  };

  const handleCheckLogin = async () => {
    clearError();
    await checkLogin();
    if (isLoggedIn) {
      await getUserInfo();
    }
  };

  const handleGetUserInfo = async () => {
    clearError();
    setResponseJson(null);
    setFetchingUserInfo(true);
    
    try {
      const { apiService } = await import('../api/core');
      const { API_ENDPOINTS, API_CONFIG } = await import('../api/config');
      
      const baseUrl = API_CONFIG.baseUrl;
      const url = `${baseUrl}${API_ENDPOINTS.USER.INFO}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(apiService.getToken() ? { 'X-API-Token': apiService.getToken()! } : {})
        }
      });
      
      const jsonData = await response.json();
      setResponseJson(JSON.stringify(jsonData, null, 2));
      await getUserInfo();
    } catch (err) {
      console.error('获取用户信息失败:', err);
      setResponseJson(JSON.stringify({ error: err instanceof Error ? err.message : '获取用户信息失败' }, null, 2));
    } finally {
      setFetchingUserInfo(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#42b983" }}>React API 测试</h1>
      
      <div style={{ background: "#f5f5f5", borderRadius: "8px", padding: "20px", margin: "20px 0" }}>
        <h2 style={{ marginTop: 0, color: "#333" }}>登录状态</h2>
        <p>已登录: {isLoggedIn ? "是" : "否"}</p>
        {isLoading && <p>加载中...</p>}
        {error && <p style={{ color: "#e74c3c", fontWeight: "bold" }}>错误: {error}</p>}
      </div>

      {!isLoggedIn && (
        <div style={{ background: "#f5f5f5", borderRadius: "8px", padding: "20px", margin: "20px 0" }}>
          <h2 style={{ marginTop: 0, color: "#333" }}>登录</h2>
          <form onSubmit={handleLogin}>
            <div style={{ margin: "15px 0" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                用户名:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ margin: "15px 0" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                密码:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {apiService?.isCaptchaEnabled() && (
              <div style={{ margin: "15px 0" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  验证码:
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="text"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    required
                    placeholder="请输入验证码"
                    style={{
                      flex: 1,
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                  <div
                    onClick={refreshCaptcha}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "120px",
                      height: "40px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      background: "#f9f9f9",
                      cursor: "pointer",
                      opacity: captchaLoading ? 0.5 : 1,
                    }}
                  >
                    {captchaImage ? (
                      <img
                        src={captchaImage}
                        alt="验证码"
                        style={{ maxWidth: "120px", maxHeight: "40px", borderRadius: "4px" }}
                      />
                    ) : (
                      <span style={{ color: "#999", fontSize: "12px" }}>加载中...</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div style={{ margin: "15px 0" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: "5px" }}
                />
                记住我
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: "#42b983",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              登录
            </button>
          </form>
        </div>
      )}

      {isLoggedIn && (
        <div style={{ background: "#f5f5f5", borderRadius: "8px", padding: "20px", margin: "20px 0" }}>
          <h2 style={{ marginTop: 0, color: "#333" }}>用户信息</h2>
          {responseJson ? (
            <div style={{ background: "#fff", padding: "15px", borderRadius: "4px", marginBottom: "15px", border: "1px solid #ddd" }}>
              <pre style={{ margin: 0, fontFamily: "'Courier New', monospace", fontSize: "14px", lineHeight: "1.5", color: "#333", whiteSpace: "pre-wrap", wordWrap: "break-word", overflowX: "auto" }}>
                {responseJson}
              </pre>
            </div>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic", marginBottom: "15px" }}>点击按钮获取用户信息</p>
          )}
          <button
            onClick={handleGetUserInfo}
            disabled={fetchingUserInfo || isLoading}
            style={{
              background: "#42b983",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              marginTop: "10px",
            }}
          >
            {fetchingUserInfo ? "请求中..." : "请求用户信息"}
          </button>
        </div>
      )}

      <div style={{ background: "#f5f5f5", borderRadius: "8px", padding: "20px", margin: "20px 0" }}>
        <h2 style={{ marginTop: 0, color: "#333" }}>操作</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleCheckLogin}
            disabled={isLoading}
            style={{
              background: "#42b983",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            检查登录状态
          </button>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              disabled={isLoading}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              登出
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
