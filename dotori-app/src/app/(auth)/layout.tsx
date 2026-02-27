import { type ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dotori-50 text-dotori-900">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-6">{children}</main>
    </div>
  )
}
