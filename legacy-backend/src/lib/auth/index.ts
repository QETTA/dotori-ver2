export { auth, signIn, signOut } from './config'

/**
 * Server-side helper to get the current user.
 * Use in Server Components or API routes:
 *
 * ```ts
 * import { getCurrentUser } from '@/lib/auth'
 *
 * const user = await getCurrentUser()
 * if (!user) redirect('/login')
 * ```
 */
export async function getCurrentUser() {
  const { auth } = await import('./config')
  const session = await auth()
  return session?.user ?? null
}

/**
 * Require authentication — throws redirect if not authenticated.
 * Use in Server Components:
 *
 * ```ts
 * import { requireAuth } from '@/lib/auth'
 *
 * export default async function ProtectedPage() {
 *   const user = await requireAuth()
 *   // user is guaranteed to exist here
 * }
 * ```
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  return user
}
