import { type ReactNode } from 'react'
import { BottomTabBar } from '@/components/dotori/BottomTabBar'
import { UTMTracker } from '@/components/dotori/UTMTracker'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gradient-main-from)] via-[var(--gradient-main-via)] to-[var(--gradient-main-to)] text-dotori-900 dark:text-dotori-50">
      <UTMTracker />
      <main id="main-content" className="mx-auto w-full max-w-md px-4 pb-24 pt-6">{children}</main>
      <BottomTabBar />
    </div>
  )
}
