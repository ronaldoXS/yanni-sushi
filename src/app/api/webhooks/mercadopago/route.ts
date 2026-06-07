import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { verificarPagamentoMP, validarWebhookMP } from "@/lib/payments/mercadopago"
import { processarPedidoAprovado } from "@/lib/utils/pedido"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-signature") ?? ""

  if (!validarWebhookMP(rawBody, signature)) {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  if (body.type !== "payment" || body.action !== "payment.updated") {
    return NextResponse.json({ ok: true })
  }

  const pagamentoId = String(body.data.id)
  const pagamento = await verificarPagamentoMP(pagamentoId)

  if (!pagamento.aprovado) {
    return NextResponse.json({ ok: true })
  }

  // Busca pedido pelo external_reference
  const pedido = await prisma.pedido.findFirst({
    where: { pagamentoId },
  })

  if (!pedido || pedido.statusPagamento === "APROVADO") {
    return NextResponse.json({ ok: true })
  }

  // ─── REGRA DE OURO: só libera para produção após confirmação ─────────────
  await prisma.$transaction(async (tx) => {
    await tx.pedido.update({
      where: { id: pedido.id },
      data: {
        statusPagamento: "APROVADO",
        status: "PAGO",
        pago_em: new Date(),
      },
    })

    await tx.pagamentoRegistro.create({
      data: {
        pedidoId: pedido.id,
        gateway: "MERCADO_PAGO",
        gatewayId: pagamentoId,
        valor: pagamento.valor ?? pedido.total,
        status: "APROVADO",
        payload: body,
      },
    })
  })

  // Processa pedido aprovado: impressão, estoque, pontos
  await processarPedidoAprovado(pedido.id)

  return NextResponse.json({ ok: true })
}
