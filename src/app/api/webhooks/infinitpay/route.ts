import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { processarPedidoAprovado } from "@/lib/utils/pedido"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-infinitpay-signature") ?? ""
  const secret = process.env.INFINITPAY_WEBHOOK_SECRET ?? ""

  // Validação HMAC
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  if (hash !== signature) {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  if (body.event !== "payment.approved") {
    return NextResponse.json({ ok: true })
  }

  const pedidoId = body.metadata?.pedido_id ?? body.order_id
  if (!pedidoId) return NextResponse.json({ erro: "pedido_id não informado" }, { status: 400 })

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } })
  if (!pedido || pedido.statusPagamento === "APROVADO") {
    return NextResponse.json({ ok: true })
  }

  await prisma.$transaction(async (tx) => {
    await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        statusPagamento: "APROVADO",
        status: "PAGO",
        pago_em: new Date(),
        pagamentoRef: body.charge_id ?? body.transaction_id,
      },
    })
    await tx.pagamentoRegistro.create({
      data: {
        pedidoId,
        gateway: "INFINITPAY",
        gatewayId: body.charge_id ?? body.transaction_id,
        valor: pedido.total,
        status: "APROVADO",
        payload: body,
      },
    })
  })

  await processarPedidoAprovado(pedidoId)
  return NextResponse.json({ ok: true })
}
