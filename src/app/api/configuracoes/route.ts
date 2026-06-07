import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeSlug = searchParams.get("unidadeSlug") ?? ""

  const unidade = await prisma.unidade.findUnique({
    where: { slug: unidadeSlug },
    include: { configuracao: true },
  })
  if (!unidade) return NextResponse.json({ erro: "Unidade não encontrada" }, { status: 404 })
  return NextResponse.json({ config: unidade.configuracao })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { unidadeSlug, ...campos } = body

  const unidade = await prisma.unidade.findUnique({ where: { slug: unidadeSlug } })
  if (!unidade) return NextResponse.json({ erro: "Unidade não encontrada" }, { status: 404 })

  const config = await prisma.configuracaoUnidade.update({
    where: { unidadeId: unidade.id },
    data: campos,
  })
  return NextResponse.json({ config })
}
