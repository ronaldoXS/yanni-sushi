/**
 * InfinitPay — Criação de cobranças por cartão online
 * Docs: https://docs.infinitpay.io
 */

const BASE_URL = "https://api.infinitpay.io/v1"

interface CriarCobrancaParams {
  pedidoId: string
  valor: number // em reais
  descricao: string
  clienteNome?: string
  clienteEmail?: string
  clienteTelefone?: string
  urlRetorno?: string
}

interface CobrancaResponse {
  id: string
  status: string
  linkPagamento: string
  valor: number
  expiracaoEm: string
}

async function fetchInfinitPay(path: string, body: object): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INFINITPAY_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const erro = await res.text()
    throw new Error(`InfinitPay erro ${res.status}: ${erro}`)
  }

  return res.json()
}

export async function criarCobrancaCartao(params: CriarCobrancaParams): Promise<CobrancaResponse> {
  const data = await fetchInfinitPay("/charges", {
    amount: Math.round(params.valor * 100), // centavos
    description: params.descricao,
    external_id: params.pedidoId,
    payment_methods: ["credit_card", "debit_card"],
    customer: {
      name: params.clienteNome ?? "Cliente",
      email: params.clienteEmail ?? "cliente@yannisushi.com.br",
      phone: params.clienteTelefone,
    },
    metadata: { pedido_id: params.pedidoId },
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/infinitpay`,
    redirect_url: params.urlRetorno ?? `${process.env.NEXT_PUBLIC_APP_URL}/pedido`,
    expires_in: 1800, // 30 minutos
  })

  return {
    id: data.id,
    status: data.status,
    linkPagamento: data.payment_link ?? data.checkout_url,
    valor: params.valor,
    expiracaoEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

export async function consultarCobranca(cobrancaId: string) {
  const res = await fetch(`${BASE_URL}/charges/${cobrancaId}`, {
    headers: { Authorization: `Bearer ${process.env.INFINITPAY_API_KEY}` },
  })
  return res.json()
}

export function validarWebhookInfinitPay(body: string, signature: string): boolean {
  const crypto = require("crypto")
  const secret = process.env.INFINITPAY_WEBHOOK_SECRET ?? ""
  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return hash === signature
}
