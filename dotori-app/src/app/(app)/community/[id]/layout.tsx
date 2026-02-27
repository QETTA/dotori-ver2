import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'

interface Props {
  params: Promise<{ id: string }>
}

interface PostResponse {
  title?: string
  content?: string
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const post = await apiFetch<PostResponse>(`/api/community/posts/${id}`, {
      unwrapData: true,
    })
    if (!post?.title) {
      return { title: '커뮤니티 글 — 도토리' }
    }
    const title = `${post.title} — 도토리`
    const description = (post.content ?? '').slice(0, 150)
    return {
      title,
      description,
      openGraph: { title, description },
    }
  } catch {
    return { title: '커뮤니티 글 — 도토리' }
  }
}

export default function CommunityDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
