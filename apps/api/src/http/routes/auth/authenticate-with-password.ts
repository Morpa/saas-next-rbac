import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with e-mail and password',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      },
    },
    async (request, replay) => {
      const { email, password } = request.body

      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!userFromEmail) {
        return replay.status(400).send({ message: 'Invalid credentials' })
      }

      if (userFromEmail.passwordHash === null) {
        return replay
          .status(400)
          .send({ message: 'User does not have a password, use social login' })
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash,
      )

      if (!isPasswordValid) {
        return replay.status(400).send({ message: 'Invalid credentials' })
      }

      const token = await replay.jwtSign(
        {
          sub: userFromEmail.id,
        },
        { sign: { expiresIn: '7d' } },
      )

      return replay.status(201).send({ token })
    },
  )
}
