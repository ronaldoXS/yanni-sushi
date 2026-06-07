import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { ajustarEstoque } from "@/lib/utils/estoque"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeId = searchParams.get("unidadeId") ?? ""
  const tipo = searchParams.get("tipo") ?? "todos"

  if (tipo === "alertas") {
    const produtos = await prisma.produto.findMany({
      where: {
        unidadeId,
        controlaEstoque: true,
        disponivel: true,
      },
      select: { id: true, nome: true, estoqueAtual: true, estoqueMinimo: true, imagemUrl: true },
    })
    const alertas = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
    return NextResponse.json({ alertas })
  }

  if (tipo === "movimentos") {
    const produtoId = searchParams.get("produtoId")
    const movimentos = await prisma.movimentoEstoque.findMany({
      where: produtoId ? { produtoId } : { produto: { unidadeId } },
      include: { produto: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 100,
    })
    return NextResponse.json({ movimentos })
  }

  const produtos = await prisma.produto.findMany({
    where: { unidadeId, controlaEstoque: true },
    select: {
      id: true, nome: true, imagemUrl: true,
      estoqueAtual: true, estoqueMinimo: true, disponivel: true,
      categoria: { select: { nome: true } },
    },
    orderBy: { nome: "asc" },
  })

  return NextResponse.json({ produtos })
}

const AjusteSchema = z.object({
  produtoId: z.string(),
  quantidade: z.number().int().positive(),
  tipo: z.enum(["ENTRADA", "SAIDA_AJUSTE", "INVENTARIO"]),
  motivo: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = AjusteSchema.parse(body)
  await ajustarEstoque(data.produtoId, data.quantidade, data.tipo, data.motivo)
  const produto = await prisma.produto.findUnique({
    where: { id: data.produtoId },
    select: { id: true, nome: true, estoqueAtual: true },
  })
  return NextResponse.json({ produto })
}
