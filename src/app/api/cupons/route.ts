import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeId = searchParams.get("unidadeId") ?? ""
  const codigo = searchParams.get("codigo")

  if (codigo) {
    const cupom = await prisma.cupom.findUnique({
      where: { codigo_unidadeId: { codigo, unidadeId } },
    })
    if (!cupom || !cupom.ativo) return NextResponse.json({ erro: "Cupom inválido" }, { status: 404 })
    if (cupom.usado && cupom.usoUnico) return NextResponse.json({ erro: "Cupom já utilizado" }, { status: 400 })
    return NextResponse.json({ cupom })
  }

  const cupons = await prisma.cupom.findMany({
    where: { unidadeId },
    orderBy: { criadoEm: "desc" },
  })
  return NextResponse.json({ cupons })
}

const CupomSchema = z.object({
  unidadeId: z.string(),
  codigo: z.string().min(3).max(20).toUpperCase(),
  tipo: z.enum(["PERCENTUAL", "FIXO"]),
  valor: z.number().positive(),
  pedidoMinimo: z.number().default(0),
  usoUnico: z.boolean().default(true),
  validoAte: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = CupomSchema.parse(body)
  const cupom = await prisma.cupom.create({
    data: {
      ...data,
      ativo: true,
      validoAte: data.validoAte ? new Date(data.validoAte) : null,
    },
  })
  return NextResponse.json({ cupom })
}

export async function PATCH(req: NextRequest) {
  const { id, ...campos } = await req.json()
  const cupom = await prisma.cupom.update({ where: { id }, data: campos })
  return NextResponse.json({ cupom })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.cupom.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
