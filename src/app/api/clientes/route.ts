import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const telefone = searchParams.get("telefone")?.replace(/\D/g, "") ?? ""

  if (!telefone) return NextResponse.json({ erro: "Telefone obrigatório" }, { status: 400 })

  const cliente = await prisma.cliente.findUnique({
    where: { telefone },
    include: {
      pontosHistorico: {
        orderBy: { criadoEm: "desc" },
        take: 20,
      },
    },
  })

  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 })

  return NextResponse.json({
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      pontos: cliente.pontos,
    },
    historico: cliente.pontosHistorico.map((h) => ({
      tipo: h.tipo,
      pontos: h.pontos,
      criadoEm: h.criadoEm,
    })),
  })
}
