'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { api } from '@/lib/api'

interface ConfigResponse {
  captcha: boolean
}

interface CaptchaResponse {
  image: string
}

export const useCaptcha = () => {
  const [image, setImage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const checkingRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<CaptchaResponse>('/auth/captcha')
      if (res.data?.image) {
        setImage(res.data.image)
      }
    } catch {
      // 静默失败
    }
  }, [])

  const check = useCallback(async () => {
    // 防止重复请求，开发模式下可能导致重复调用
    if (checkingRef.current) {
      return
    }
    checkingRef.current = true
    try {
      const res = await api.get<ConfigResponse>('/get-config')
      setEnabled(res.data?.captcha ?? false)
      if (res.data?.captcha) {
        await refresh()
      }
      checkingRef.current = false
    } catch {
      setEnabled(false)
      checkingRef.current = false
    }
  }, [refresh])

  return useMemo(() => ({ image, enabled, check, refresh }), [image, enabled, check, refresh])
}
