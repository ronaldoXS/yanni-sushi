import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeId = searchParams.get("unidadeId") ?? ""
  const tipo = searchParams.get("tipo") ?? "aberto"

  if (tipo === "aberto") {
    const caixa = await prisma.caixa.findFirst({
      where: { unidadeId, status: "ABERTO" },
      orderBy: { dataAbertura: "desc" },
    })
    return NextResponse.json({ caixa })
  }

  const historico = await prisma.caixa.findMany({
    where: { unidadeId, status: "FECHADO" },
    orderBy: { dataAbertura: "desc" },
    take: 30,
  })
  return NextResponse.json({ historico })
}

const AbrirSchema = z.object({
  unidadeId: z.string(),
  saldoInicial: z.number().min(0),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = AbrirSchema.parse(body)

  const aberto = await prisma.caixa.findFirst({
    where: { unidadeId: data.unidadeId, status: "ABERTO" },
  })
  if (aberto) return NextResponse.json({ erro: "Já existe um caixa aberto" }, { status: 400 })

  const caixa = await prisma.caixa.create({
    data: { unidadeId: data.unidadeId, saldoInicial: data.saldoInicial, status: "ABERTO" },
  })
  return NextResponse.json({ caixa })
}

const FecharSchema = z.object({
  caixaId: z.string(),
  saldoFinal: z.number().min(0),
  observacoes: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const data = FecharSchema.parse(body)

  const caixa = await prisma.caixa.findUnique({ where: { id: data.caixaId } })
  if (!caixa || caixa.status === "FECHADO")
    return NextResponse.json({ erro: "Caixa não encontrado ou já fechado" }, { status: 400 })

  const periodo = {
    gte: startOfDay(caixa.dataAbertura),
    lte: new Date(),
  }

  const pedidos = await prisma.pedido.findMany({
    where: { unidadeId: caixa.unidadeId, criadoEm: periodo, statusPagamento: "APROVADO" },
  })

  const totalVendas = pedidos.reduce((a, p) => a + Number(p.total), 0)
  const totalPix = pedidos.filter((p) => p.formaPagamento === "PIX").reduce((a, p) => a + Number(p.total), 0)
  const totalCartao = pedidos.filter((p) => p.formaPagamento === "CARTAO_ONLINE").reduce((a, p) => a + Number(p.total), 0)
  const totalDinheiro = pedidos.filter((p) => ["DINHEIRO", "CARTAO_PRESENCIAL"].includes(p.formaPagamento)).reduce((a, p) => a + Number(p.total), 0)

  const fechado = await prisma.caixa.update({
    where: { id: data.caixaId },
    data: {
      status: "FECHADO",
      dataFechamento: new Date(),
      saldoFinal: data.saldoFinal,
      totalVendas,
      totalPix,
      totalCartao,
      totalDinheiro,
      observacoes: data.observacoes,
    },
  })

  return NextResponse.json({ caixa: fechado, totalVendas, totalPix, totalCartao, totalDinheiro })
}
