import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay, subDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeId = searchParams.get("unidadeId") ?? ""
  const tipo = searchParams.get("tipo") ?? "resumo"
  const dias = parseInt(searchParams.get("dias") ?? "7")

  const inicio = startOfDay(subDays(new Date(), dias - 1))
  const fim = endOfDay(new Date())

  if (tipo === "ranking") {
    // Ranking de produtos mais vendidos
    const ranking = await prisma.itemPedido.groupBy({
      by: ["produtoId", "nome"],
      where: {
        pedido: {
          unidadeId,
          status: { in: ["ENTREGUE", "PRONTO", "EM_PREPARO"] },
          criadoEm: { gte: inicio, lte: fim },
        },
      },
      _sum: { quantidade: true },
      _count: { pedidoId: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 20,
    })

    // Enriquece com dados de custo para CMV
    const ids = ranking.map((r) => r.produtoId)
    const produtos = await prisma.produto.findMany({
      where: { id: { in: ids } },
      select: { id: true, preco: true, precoCusto: true },
    })

    const rankingEnriquecido = ranking.map((r) => {
      const p = produtos.find((x) => x.id === r.produtoId)
      const qtd = r._sum.quantidade ?? 0
      const receita = qtd * Number(p?.preco ?? 0)
      const custo = qtd * Number(p?.precoCusto ?? 0)
      return {
        produtoId: r.produtoId,
        nome: r.nome,
        quantidade: qtd,
        receita,
        custo,
        lucro: receita - custo,
        cmv: receita > 0 ? (custo / receita) * 100 : 0,
      }
    })

    return NextResponse.json({ ranking: rankingEnriquecido })
  }

  if (tipo === "resumo_noturno") {
    // Resumo do dia anterior
    const ontem = {
      inicio: startOfDay(subDays(new Date(), 1)),
      fim: endOfDay(subDays(new Date(), 1)),
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        unidadeId,
        criadoEm: { gte: ontem.inicio, lte: ontem.fim },
        statusPagamento: "APROVADO",
      },
      include: { itens: true },
    })

    const totalBruto = pedidos.reduce((a, p) => a + Number(p.total), 0)
    const totalPix = pedidos
      .filter((p) => p.formaPagamento === "PIX")
      .reduce((a, p) => a + Number(p.total), 0)
    const totalCartao = pedidos
      .filter((p) => p.formaPagamento === "CARTAO_ONLINE")
      .reduce((a, p) => a + Number(p.total), 0)
    const totalPresencial = pedidos
      .filter((p) => ["DINHEIRO", "CARTAO_PRESENCIAL"].includes(p.formaPagamento))
      .reduce((a, p) => a + Number(p.total), 0)

    return NextResponse.json({
      data: format(ontem.inicio, "dd/MM/yyyy", { locale: ptBR }),
      totalPedidos: pedidos.length,
      totalBruto,
      totalPix,
      totalCartao,
      totalPresencial,
    })
  }

  // Resumo geral (padrão)
  const pedidos = await prisma.pedido.aggregate({
    where: {
      unidadeId,
      criadoEm: { gte: inicio, lte: fim },
      statusPagamento: "APROVADO",
    },
    _count: { id: true },
    _sum: { total: true },
  })

  return NextResponse.json({
    periodo: `${dias} dias`,
    totalPedidos: pedidos._count.id,
    receitaTotal: Number(pedidos._sum.total ?? 0),
  })
}
