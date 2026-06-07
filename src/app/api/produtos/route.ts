import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { logarAlteracao } from "@/lib/utils/pedido"
import { getServerSession } from "next-auth"

const ProdutoSchema = z.object({
  unidadeId: z.string(),
  categoriaId: z.string(),
  nome: z.string().min(2),
  descricao: z.string().optional(),
  imagemUrl: z.string().optional(),
  preco: z.number().positive(),
  precoCusto: z.number().optional(),
  disponivel: z.boolean().default(true),
  destaque: z.boolean().default(false),
  especial: z.boolean().default(false),
  especialQtd: z.number().optional(),
  sugestaoChef: z.boolean().default(false),
  rotaImpressao: z.enum(["COZINHA", "BAR", "AMBOS"]).default("COZINHA"),
  controlaEstoque: z.boolean().default(false),
  estoqueAtual: z.number().default(0),
  estoqueMinimo: z.number().default(0),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeId = searchParams.get("unidadeId") ?? ""
  const admin = searchParams.get("admin") === "true"

  const produtos = await prisma.produto.findMany({
    where: {
      unidadeId,
      ...(admin ? {} : { disponivel: true }),
    },
    include: { categoria: true },
    orderBy: [{ categoria: { ordem: "asc" } }, { nome: "asc" }],
  })

  return NextResponse.json({ produtos })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const data = ProdutoSchema.parse(body)

  const produto = await prisma.produto.create({ data })

  await logarAlteracao({
    usuarioId: (session.user as any)?.id,
    entidade: "Produto",
    entidadeId: produto.id,
    campo: "criacao",
    valorDepois: produto.nome,
  })

  return NextResponse.json({ produto })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const { id, ...campos } = body

  const antes = await prisma.produto.findUnique({ where: { id } })
  if (!antes) return NextResponse.json({ erro: "Produto não encontrado" }, { status: 404 })

  const produto = await prisma.produto.update({ where: { id }, data: campos })

  // Registra log para campos sensíveis
  const camposAuditados = ["preco", "precoCusto", "disponivel", "nome"] as const
  for (const campo of camposAuditados) {
    if (campos[campo] !== undefined && String(antes[campo]) !== String(campos[campo])) {
      await logarAlteracao({
        usuarioId: (session.user as any)?.id,
        entidade: "Produto",
        entidadeId: id,
        produtoId: id,
        campo,
        valorAntes: String(antes[campo]),
        valorDepois: String(campos[campo]),
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      })
    }
  }

  return NextResponse.json({ produto })
}
