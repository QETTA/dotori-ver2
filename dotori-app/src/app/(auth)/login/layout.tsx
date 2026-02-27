import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인 — 도토리',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
