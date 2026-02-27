'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface UseApiState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * useApi — 범용 API fetch 훅
 * path가 null이면 fetch 생략 (조건부 호출)
 */
export function useApi<T>(path: string | null): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!path) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiFetch<T>(path, { unwrapData: true })
      if (mountedRef.current) setData(result)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '데이터를 불러오지 못했어요')
      }
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [path])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
