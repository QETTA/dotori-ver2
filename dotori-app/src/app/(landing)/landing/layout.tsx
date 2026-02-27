import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '도토리 — 어린이집·유치원 탐색 AI 플랫폼',
  description: '어린이집·유치원 통합 검색, AI 이동 상담, 전자서명까지 10분 완결. 2026 유보통합 대응.',
  openGraph: {
    title: '도토리 — 어린이집·유치원 탐색 AI 플랫폼',
    description: '어린이집·유치원 통합 검색, AI 이동 상담, 전자서명까지 10분 완결.',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
