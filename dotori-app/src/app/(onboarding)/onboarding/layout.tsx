import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '온보딩 — 도토리',
  robots: { index: false, follow: false },
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
