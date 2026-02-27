'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'
import { formatRelativeTime, CATEGORY_LABELS } from '@/lib/utils'

interface ApiCommunityPost {
  _id: string
  title?: string
  content: string
  category: string
  authorId?: { _id?: string; nickname?: string; name?: string; image?: string; gpsVerified?: boolean } | null
  author?: { nickname?: string; name?: string; avatar?: string; image?: string; gpsVerified?: boolean }
  likes: number
  likedBy?: string[]
  commentCount: number
  createdAt: string
  facilityTags?: string[]
}

export interface CommunityPostDetail {
  id: string
  author: string
  authorImage?: string
  authorVerified: boolean
  time: string
  title: string
  content: string
  category: string
  categoryLabel: string
  likes: number
  likedBy: string[]
  commentCount: number
  facilityTags: string[]
}

function toPostDetail(post: ApiCommunityPost): CommunityPostDetail {
  const populatedAuthor = post.authorId && typeof post.authorId === 'object' ? post.authorId : null
  const legacyAuthor = post.author

  const authorName = populatedAuthor?.nickname ?? populatedAuthor?.name ?? legacyAuthor?.nickname ?? legacyAuthor?.name ?? '익명'
  const authorImage = populatedAuthor?.image ?? legacyAuthor?.avatar ?? legacyAuthor?.image
  const authorVerified = populatedAuthor?.gpsVerified ?? legacyAuthor?.gpsVerified ?? false

  return {
    id: post._id,
    author: authorName,
    authorImage,
    authorVerified,
    time: formatRelativeTime(post.createdAt),
    title: post.title ?? '',
    content: post.content,
    category: post.category,
    categoryLabel: CATEGORY_LABELS[post.category] ?? post.category,
    likes: post.likes,
    likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
    commentCount: post.commentCount,
    facilityTags: post.facilityTags ?? [],
  }
}

export function useCommunityDetail(id: string) {
  const { data, isLoading, error, refetch } = useApi<ApiCommunityPost>(
    id ? `/api/community/posts/${id}` : null,
  )

  const post = useMemo(() => (data ? toPostDetail(data) : null), [data])

  return { post, isLoading, error, refetch }
}
