import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

/**
 * NextAuth v5 configuration for 도토리
 *
 * Providers:
 *  - Kakao OAuth (primary)
 *  - Naver OAuth (secondary)
 *  - Credentials (dev/testing)
 *
 * Note: KakaoProvider and NaverProvider are custom because
 * NextAuth doesn't have built-in Korean OAuth providers.
 */

/* ─── Kakao Provider ─── */
function KakaoProvider() {
  return {
    id: 'kakao',
    name: '카카오',
    type: 'oauth' as const,
    authorization: {
      url: 'https://kauth.kakao.com/oauth/authorize',
      params: { scope: 'profile_nickname profile_image account_email' },
    },
    token: 'https://kauth.kakao.com/oauth/token',
    userinfo: 'https://kapi.kakao.com/v2/user/me',
    clientId: process.env.KAKAO_CLIENT_ID ?? process.env.NEXT_PUBLIC_KAKAO_KEY!,
    clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    profile(profile: any) {
      return {
        id: String(profile.id),
        name: profile.kakao_account?.profile?.nickname ?? profile.properties?.nickname ?? '사용자',
        email: profile.kakao_account?.email ?? `${profile.id}@kakao.user`,
        image: profile.kakao_account?.profile?.profile_image_url ?? profile.properties?.profile_image,
      }
    },
  }
}

/* ─── Naver Provider ─── */
function NaverProvider() {
  return {
    id: 'naver',
    name: '네이버',
    type: 'oauth' as const,
    authorization: {
      url: 'https://nid.naver.com/oauth2.0/authorize',
      params: { response_type: 'code' },
    },
    token: 'https://nid.naver.com/oauth2.0/token',
    userinfo: 'https://openapi.naver.com/v1/nid/me',
    clientId: process.env.NEXT_PUBLIC_NAVER_KEY!,
    clientSecret: process.env.NAVER_CLIENT_SECRET!,
    profile(profile: any) {
      const data = profile.response
      return {
        id: data.id,
        name: data.name ?? data.nickname ?? '사용자',
        email: data.email,
        image: data.profile_image,
      }
    },
  }
}

/* ─── Auth Config ─── */
export const authConfig: NextAuthConfig = {
  providers: [
    KakaoProvider(),
    NaverProvider(),
    // Dev/testing only — remove in production
    ...(process.env.NODE_ENV === 'development'
      ? [
          Credentials({
            name: '개발 로그인',
            credentials: {
              email: { label: '이메일', type: 'email', placeholder: 'test@dotori.ai' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null
              // In dev mode, auto-create a test user
              return {
                id: 'dev_user_1',
                name: '테스트 사용자',
                email: credentials.email as string,
                image: null,
              }
            },
          }),
        ]
      : []),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/onboarding',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.provider = account?.provider ?? 'credentials'
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.provider = token.provider
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // After sign in, redirect to home
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return baseUrl
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/onboarding')
      const isAdminPage = nextUrl.pathname.startsWith('/admin')

      // All pages are public (로그인 없이 무료 접근)
      // Auth pages — redirect logged-in users to home
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/home', nextUrl))
      }

      // Admin pages — require admin role
      if (isAdminPage) return isLoggedIn

      // Everything else is accessible without login
      return true
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
