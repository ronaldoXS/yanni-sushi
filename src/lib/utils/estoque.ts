import { prisma } from "@/lib/db/prisma"
import type { ItemPedido, Produto } from "@prisma/client"

type ItemComProduto = ItemPedido & { produto: Produto }

export async function baixarEstoque(itens: ItemComProduto[]) {
  const itensComeEstoque = itens.filter((i) => i.produto.controlaEstoque)

  for (const item of itensComeEstoque) {
    await prisma.$transaction([
      prisma.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      }),
      prisma.movimentoEstoque.create({
        data: {
          produtoId: item.produtoId,
          tipo: "SAIDA_VENDA",
          quantidade: item.quantidade,
          motivo: `Pedido automático`,
        },
      }),
    ])
  }
}

export async function ajustarEstoque(
  produtoId: string,
  quantidade: number,
  tipo: "ENTRADA" | "SAIDA_AJUSTE" | "INVENTARIO",
  motivo?: string
) {
  const delta = tipo === "ENTRADA" ? quantidade : -quantidade

  await prisma.$transaction([
    prisma.produto.update({
      where: { id: produtoId },
      data: { estoqueAtual: { increment: delta } },
    }),
    prisma.movimentoEstoque.create({
      data: { produtoId, tipo, quantidade, motivo },
    }),
  ])
}

export async function produtosAbaixoMinimo(unidadeId: string) {
  return prisma.produto.findMany({
    where: {
      unidadeId,
      controlaEstoque: true,
      disponivel: true,
      estoqueAtual: { lte: prisma.produto.fields.estoqueMinimo },
    },
    select: { id: true, nome: true, estoqueAtual: true, estoqueMinimo: true },
  })
}
