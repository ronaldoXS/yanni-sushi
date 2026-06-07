import { prisma } from "@/lib/db/prisma"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type PedidoComItens = Awaited<
  ReturnType<typeof prisma.pedido.findUnique> & {
    itens: { produto: { rotaImpressao: string }; nome: string; quantidade: number; observacao?: string | null }[]
    unidade: { nome: string }
  }
>

/**
 * Divide os itens por rota de impressão e envia para cada impressora.
 * Em produção: integrar com escpos, PrintNode ou WebSocket.
 */
export async function enviarParaImpressora(pedido: any) {
  const itensCozinha = pedido.itens.filter(
    (i: any) => ["COZINHA", "AMBOS"].includes(i.rotaImpressao)
  )
  const itensBar = pedido.itens.filter(
    (i: any) => ["BAR", "AMBOS"].includes(i.rotaImpressao)
  )

  if (itensCozinha.length > 0) {
    const comanda = gerarComanda(pedido, itensCozinha, "COZINHA")
    await imprimirComanda(comanda, "COZINHA")
  }

  if (itensBar.length > 0) {
    const comanda = gerarComanda(pedido, itensBar, "BAR")
    await imprimirComanda(comanda, "BAR")
  }

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { impresso: true },
  })
}

function gerarComanda(pedido: any, itens: any[], rota: string): string {
  const hora = format(new Date(), "HH:mm", { locale: ptBR })
  const linhas = [
    `===== ${rota} - ${hora} =====`,
    `Pedido #${pedido.numero}`,
    `Tipo: ${pedido.tipo}`,
    pedido.clienteNome ? `Cliente: ${pedido.clienteNome}` : "",
    "------------------------",
    ...itens.map(
      (i: any) =>
        `${i.quantidade}x ${i.nome}${i.observacao ? `\n   > ${i.observacao}` : ""}`
    ),
    "========================",
  ]

  return linhas.filter(Boolean).join("\n")
}

async function imprimirComanda(texto: string, rota: string) {
  // TODO: Integrar com impressora via escpos, PrintNode ou WebSocket local
  // Por ora, salva log para debug
  console.log(`[IMPRESSORA ${rota}]\n${texto}`)
}
