import { type ReactNode } from 'react'

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dotori-900 text-dotori-50">
      {children}
    </div>
  )
}
