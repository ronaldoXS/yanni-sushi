import { prisma } from "@/lib/db/prisma"

export async function registrarPontos(
  telefone: string,
  pontos: number,
  pedidoId: string
) {
  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    create: { telefone, pontos },
    update: { pontos: { increment: pontos } },
  })

  await prisma.pontoHistorico.create({
    data: {
      clienteId: cliente.id,
      tipo: "GANHO",
      pontos,
      pedidoId,
    },
  })

  return cliente
}

export async function resgatarPontos(
  telefone: string,
  pontosParaResgatar: number
) {
  const cliente = await prisma.cliente.findUnique({ where: { telefone } })

  if (!cliente || cliente.pontos < pontosParaResgatar) {
    throw new Error("Pontos insuficientes")
  }

  await prisma.$transaction([
    prisma.cliente.update({
      where: { telefone },
      data: { pontos: { decrement: pontosParaResgatar } },
    }),
    prisma.pontoHistorico.create({
      data: {
        clienteId: cliente.id,
        tipo: "RESGATADO",
        pontos: -pontosParaResgatar,
      },
    }),
  ])

  return true
}

export async function validarCupom(
  codigo: string,
  unidadeId: string,
  valorPedido: number
) {
  const cupom = await prisma.cupom.findUnique({
    where: { codigo_unidadeId: { codigo, unidadeId } },
  })

  if (!cupom || !cupom.ativo) throw new Error("Cupom inválido ou inativo")
  if (cupom.usado && cupom.usoUnico) throw new Error("Cupom já utilizado")
  if (cupom.validoAte && new Date() > cupom.validoAte) throw new Error("Cupom expirado")
  if (valorPedido < Number(cupom.pedidoMinimo))
    throw new Error(`Pedido mínimo: R$ ${cupom.pedidoMinimo}`)

  const desconto =
    cupom.tipo === "PERCENTUAL"
      ? (valorPedido * Number(cupom.valor)) / 100
      : Number(cupom.valor)

  return { cupom, desconto: Math.min(desconto, valorPedido) }
}
