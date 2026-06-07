import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { criarPixDinamico } from "@/lib/payments/mercadopago"
import { criarCobrancaCartao } from "@/lib/payments/infinitpay"
import { validarCupom } from "@/lib/utils/fidelidade"

const ItemSchema = z.object({
  produtoId: z.string(),
  quantidade: z.number().min(1),
  observacao: z.string().optional(),
})

const PedidoSchema = z.object({
  unidadeId: z.string(),
  tipo: z.enum(["DELIVERY", "RETIRADA", "MESA"]),
  clienteNome: z.string().optional(),
  clienteTelefone: z.string().optional(),
  clienteEmail: z.string().email().optional(),
  enderecoEntrega: z.string().optional(),
  observacoes: z.string().optional(),
  formaPagamento: z.enum(["PIX", "CARTAO_ONLINE", "DINHEIRO", "CARTAO_PRESENCIAL", "PONTOS"]),
  cupomCodigo: z.string().optional(),
  pontosUsados: z.number().default(0),
  itens: z.array(ItemSchema).min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = PedidoSchema.parse(body)

  const produtos = await prisma.produto.findMany({
    where: {
      id: { in: data.itens.map((i) => i.produtoId) },
      unidadeId: data.unidadeId,
      disponivel: true,
    },
  })

  if (produtos.length !== data.itens.length) {
    return NextResponse.json({ erro: "Um ou mais produtos indisponíveis" }, { status: 400 })
  }

  const config = await prisma.configuracaoUnidade.findUnique({
    where: { unidadeId: data.unidadeId },
  })

  const subtotal = data.itens.reduce((acc, item) => {
    const produto = produtos.find((p) => p.id === item.produtoId)!
    return acc + Number(produto.preco) * item.quantidade
  }, 0)

  const taxaEntrega = data.tipo === "DELIVERY" ? Number(config?.taxaEntrega ?? 0) : 0

  let desconto = 0
  let cupomId: string | undefined

  if (data.cupomCodigo) {
    const { cupom, desconto: d } = await validarCupom(data.cupomCodigo, data.unidadeId, subtotal)
    desconto += d
    cupomId = cupom.id
  }

  let pontosUsados = 0
  if (data.pontosUsados > 0 && config?.programaPontos) {
    const descontoPorPonto = Number(config.descontoPontos) / config.pontosParaDesconto
    desconto += data.pontosUsados * descontoPorPonto
    pontosUsados = data.pontosUsados
  }

  const total = Math.max(subtotal + taxaEntrega - desconto, 0)

  const ultimo = await prisma.pedido.findFirst({
    where: { unidadeId: data.unidadeId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  })
  const numero = (ultimo?.numero ?? 0) + 1

  const pagamentoPresencial = ["DINHEIRO", "CARTAO_PRESENCIAL"].includes(data.formaPagamento)

  const pedido = await prisma.pedido.create({
    data: {
      unidadeId: data.unidadeId,
      numero,
      tipo: data.tipo,
      clienteNome: data.clienteNome,
      clienteTelefone: data.clienteTelefone,
      clienteEmail: data.clienteEmail,
      enderecoEntrega: data.enderecoEntrega,
      observacoes: data.observacoes,
      formaPagamento: data.formaPagamento,
      statusPagamento: "PENDENTE",
      status: pagamentoPresencial ? "EM_PREPARO" : "AGUARDANDO_PAGAMENTO",
      subtotal,
      taxaEntrega,
      desconto,
      total,
      cupomId,
      pontosUsados,
      itens: {
        create: data.itens.map((item) => {
          const produto = produtos.find((p) => p.id === item.produtoId)!
          return {
            produtoId: item.produtoId,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: item.quantidade,
            observacao: item.observacao,
            rotaImpressao: produto.rotaImpressao,
          }
        }),
      },
    },
  })

  if (cupomId) {
    await prisma.cupom.update({ where: { id: cupomId }, data: { usado: true } })
  }

  // ── Gera Pix (Mercado Pago) ──────────────────────────────────
  let pix = null
  if (data.formaPagamento === "PIX") {
    pix = await criarPixDinamico({
      pedidoId: pedido.id,
      valor: total,
      descricao: `Yanni Sushi - Pedido #${numero}`,
      clienteEmail: data.clienteEmail,
      clienteNome: data.clienteNome,
    })
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { pagamentoId: pix.id },
    })
  }

  // ── Gera cobrança por cartão (InfinitPay) ────────────────────
  let cartao = null
  if (data.formaPagamento === "CARTAO_ONLINE") {
    cartao = await criarCobrancaCartao({
      pedidoId: pedido.id,
      valor: total,
      descricao: `Yanni Sushi - Pedido #${numero}`,
      clienteNome: data.clienteNome,
      clienteEmail: data.clienteEmail,
      clienteTelefone: data.clienteTelefone,
      urlRetorno: `${process.env.NEXT_PUBLIC_APP_URL}/pedido?id=${pedido.id}`,
    })
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { pagamentoId: cartao.id, pagamentoRef: cartao.linkPagamento },
    })
  }

  return NextResponse.json({
    pedido: { id: pedido.id, numero, status: pedido.status, total },
    pix,
    cartao,
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unidadeId = searchParams.get("unidadeId")
  const status = searchParams.get("status")

  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(unidadeId ? { unidadeId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: { itens: true },
    orderBy: { criadoEm: "desc" },
    take: 50,
  })

  return NextResponse.json({ pedidos })
}
