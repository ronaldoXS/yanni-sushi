import { prisma } from "@/lib/db/prisma"
import { baixarEstoque } from "@/lib/utils/estoque"
import { registrarPontos } from "@/lib/utils/fidelidade"
import { enviarParaImpressora } from "@/lib/printing/impressora"

/**
 * Executado após confirmação de pagamento (webhook).
 * Garante: impressão, baixa de estoque e crédito de pontos.
 */
export async function processarPedidoAprovado(pedidoId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      itens: { include: { produto: true } },
      unidade: { include: { configuracao: true } },
    },
  })

  if (!pedido) throw new Error(`Pedido ${pedidoId} não encontrado`)

  // 1. Baixa de estoque automática
  await baixarEstoque(pedido.itens)

  // 2. Crédito de pontos
  if (pedido.clienteTelefone && pedido.unidade.configuracao?.programaPontos) {
    const config = pedido.unidade.configuracao
    const pontos = Math.floor(Number(pedido.total) * config.pontosPorReal)
    await registrarPontos(pedido.clienteTelefone, pontos, pedido.id)

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { pontosGanhos: pontos },
    })
  }

  // 3. Envio para impressora(s)
  await enviarParaImpressora(pedido)

  return true
}

export async function logarAlteracao(params: {
  usuarioId?: string
  entidade: string
  entidadeId: string
  campo: string
  valorAntes?: string
  valorDepois?: string
  ip?: string
  produtoId?: string
}) {
  return prisma.logAlteracao.create({ data: params })
}
