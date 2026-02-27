'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'

interface ApiComment {
  _id: string
  content: string
  authorId?: { _id?: string; nickname?: string; name?: string; image?: string } | null
  author?: { nickname?: string; name?: string; avatar?: string; image?: string }
  createdAt: string
}

interface ApiCommentsResponse {
  data: ApiComment[]
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CommentView {
  id: string
  author: string
  initials: string
  authorImage?: string
  time: string
  body: string
}

function toCommentView(c: ApiComment): CommentView {
  const populatedAuthor = c.authorId && typeof c.authorId === 'object' ? c.authorId : null
  const legacyAuthor = c.author
  const name = populatedAuthor?.nickname ?? populatedAuthor?.name ?? legacyAuthor?.nickname ?? legacyAuthor?.name ?? '익명'

  return {
    id: c._id,
    author: name,
    initials: name.charAt(0),
    authorImage: populatedAuthor?.image ?? legacyAuthor?.avatar ?? legacyAuthor?.image,
    time: formatRelativeTime(c.createdAt),
    body: c.content,
  }
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<CommentView[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchComments = useCallback(async () => {
    if (!postId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch<ApiCommentsResponse>(
        `/api/community/posts/${postId}/comments`,
      )
      if (mountedRef.current) {
        const data = Array.isArray(res.data) ? res.data : []
        setComments(data.map(toCommentView))
        setTotal(res.pagination?.total ?? data.length)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '댓글을 불러오지 못했어요')
      }
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    mountedRef.current = true
    fetchComments()
    return () => { mountedRef.current = false }
  }, [fetchComments])

  const postComment = useCallback(async (content: string) => {
    await apiFetch(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    fetchComments()
  }, [postId, fetchComments])

  return { comments, total, isLoading, error, refetch: fetchComments, postComment }
}
