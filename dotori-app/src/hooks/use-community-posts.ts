'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'
import { formatRelativeTime, CATEGORY_LABELS } from '@/lib/utils'

interface ApiPost {
  _id: string
  title?: string
  content: string
  category: string
  author?: { nickname?: string } | null
  likeCount: number
  commentCount: number
  createdAt: string
}

export interface CommunityPostView {
  id: string
  author: string
  time: string
  title: string
  preview: string
  likes: number
  comments: number
  category: string
}

export { CATEGORY_LABELS } from '@/lib/utils'

function toPostView(post: ApiPost): CommunityPostView {
  return {
    id: post._id,
    author: post.author?.nickname ?? '익명',
    time: formatRelativeTime(post.createdAt),
    title: post.title ?? '',
    preview: post.content.slice(0, 100),
    likes: post.likeCount,
    comments: post.commentCount,
    category: CATEGORY_LABELS[post.category] ?? post.category,
  }
}

export function useCommunityPosts(category?: string) {
  const apiCategory =
    category && category !== '전체'
      ? Object.entries(CATEGORY_LABELS).find(([, v]) => v === category)?.[0]
      : undefined

  const params = new URLSearchParams()
  if (apiCategory) params.set('category', apiCategory)
  const path = `/api/community/posts${params.toString() ? `?${params}` : ''}`

  const { data, isLoading, error, refetch } = useApi<ApiPost[]>(path)

  const posts = useMemo(() => (data ?? []).map(toPostView), [data])

  return { posts, isLoading, error, refetch }
}
