import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { updateProfileSchema, userProfileResponseSchema, userProfileUpdateResponseSchema } from '@/lib/validations'

export const GET = apiHandler({
  auth: true,
  handler: async ({ user }) => {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user!.email },
        include: { children: true },
      })
      if (!dbUser) throw new Error('User not found')
      const responseData = userProfileResponseSchema.parse({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        provider: dbUser.provider,
        plan: dbUser.plan,
        role: dbUser.role,
        isOnboarded: dbUser.isOnboarded,
        children: dbUser.children.map((c) => ({ id: c.id, name: c.name, birthDate: c.birthDate })),
        createdAt: dbUser.createdAt.toISOString(),
      })
      return ok(responseData)
    } catch {
      const responseData = userProfileResponseSchema.parse({
        id: user!.id,
        name: user!.name,
        email: user!.email,
        provider: 'kakao',
        plan: user!.plan,
        role: user!.role,
        isOnboarded: true,
        children: [],
        createdAt: new Date().toISOString(),
      })
      return ok(responseData)
    }
  },
})

export const PATCH = apiHandler({
  auth: true,
  input: updateProfileSchema,
  handler: async ({ user, input }) => {
    try {
      await prisma.user.update({
        where: { email: user!.email },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.notifyPush != null && { notifyPush: input.notifyPush }),
          ...(input.notifyKakao != null && { notifyKakao: input.notifyKakao }),
        },
      })
      return ok(userProfileUpdateResponseSchema.parse({ updated: true }))
    } catch (error) {
      console.error('[API] Database error:', error)
      return Response.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: '서비스에 일시적인 문제가 발생했습니다.' } },
        { status: 503 },
      ) as any
    }
  },
})
