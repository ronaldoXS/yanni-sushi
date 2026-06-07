import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: {
      itens: {
        select: { nome: true, quantidade: true, preco: true, observacao: true },
      },
    },
  })
  if (!pedido) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })
  return NextResponse.json({
    id: pedido.id,
    numero: pedido.numero,
    status: pedido.status,
    tipo: pedido.tipo,
    total: Number(pedido.total),
    clienteNome: pedido.clienteNome,
    formaPagamento: pedido.formaPagamento,
    criadoEm: pedido.criadoEm,
    itens: pedido.itens.map((i) => ({
      nome: i.nome,
      quantidade: i.quantidade,
      preco: Number(i.preco),
      observacao: i.observacao,
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const pedido = await prisma.pedido.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json({ pedido })
}
