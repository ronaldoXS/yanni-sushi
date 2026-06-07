import { MercadoPagoConfig, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export interface CriarPixParams {
  pedidoId: string
  valor: number
  descricao: string
  clienteEmail?: string
  clienteNome?: string
}

export interface PixResponse {
  id: string
  qrCode: string
  qrCodeBase64: string
  ticketUrl: string
  expiracaoEm: string
}

export async function criarPixDinamico(params: CriarPixParams): Promise<PixResponse> {
  const resp = await payment.create({
    body: {
      transaction_amount: params.valor,
      description: params.descricao,
      payment_method_id: "pix",
      payer: {
        email: params.clienteEmail ?? "cliente@yannisushi.com.br",
        first_name: params.clienteNome ?? "Cliente",
      },
      external_reference: params.pedidoId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30min
    },
  })

  const txInfo = resp.point_of_interaction?.transaction_data

  if (!txInfo?.qr_code || !txInfo?.qr_code_base64) {
    throw new Error("Falha ao gerar QR Code Pix")
  }

  return {
    id: String(resp.id),
    qrCode: txInfo.qr_code,
    qrCodeBase64: txInfo.qr_code_base64,
    ticketUrl: txInfo.ticket_url ?? "",
    expiracaoEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

export async function verificarPagamentoMP(pagamentoId: string) {
  const resp = await payment.get({ id: Number(pagamentoId) })
  return {
    id: String(resp.id),
    status: resp.status,
    aprovado: resp.status === "approved",
    valor: resp.transaction_amount,
  }
}

export function validarWebhookMP(body: string, signature: string): boolean {
  // Validação de assinatura do webhook Mercado Pago
  // Implementar conforme documentação oficial
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!
  const crypto = require("crypto")
  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return hash === signature
}
