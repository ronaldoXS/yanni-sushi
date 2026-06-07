import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 }, // 12h
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null

        const usuario = await prisma.usuario.findFirst({
          where: {
            email: credentials.email,
            ativo: true,
          },
          include: { unidade: true },
        })

        if (!usuario) return null

        const senhaOk = await bcrypt.compare(credentials.senha, usuario.senha)
        if (!senhaOk) return null

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          unidadeId: usuario.unidadeId,
          unidadeSlug: usuario.unidade.slug,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.unidadeId = (user as any).unidadeId
        token.unidadeSlug = (user as any).unidadeSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).unidadeId = token.unidadeId
        ;(session.user as any).unidadeSlug = token.unidadeSlug
      }
      return session
    },
  },
}
