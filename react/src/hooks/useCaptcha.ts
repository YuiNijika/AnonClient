import { useState, useCallback, useMemo, useRef } from 'react'
import { useApi } from './useApi'

interface ConfigResponse {
  captcha: boolean
}

interface CaptchaResponse {
  image: string
}

export const useCaptcha = () => {
  const { get } = useApi()
  const [image, setImage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const checkingRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const res = await get<CaptchaResponse>('/auth/captcha')
      if (res.data?.image) {
        setImage(res.data.image)
      }
    } catch {
      // 静默失败
    }
  }, [get])

  const check = useCallback(async () => {
    // 防止重复请求，StrictMode 会导致重复调用
    if (checkingRef.current) {
      return
    }
    checkingRef.current = true
    try {
      const res = await get<ConfigResponse>('/get-config')
      setEnabled(res.data?.captcha ?? false)
      if (res.data?.captcha) {
        await refresh()
      }
      checkingRef.current = false
    } catch {
      setEnabled(false)
      checkingRef.current = false
    }
  }, [get, refresh])

  return useMemo(() => ({ image, enabled, check, refresh }), [image, enabled, check, refresh])
}
