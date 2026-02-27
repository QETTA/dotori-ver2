import { type ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dotori-50 text-dotori-900">
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
