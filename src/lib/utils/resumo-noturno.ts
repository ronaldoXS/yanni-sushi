import cron from "node-cron"
import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay, subDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Resumo noturno automático — todo dia às 23h (Fortaleza)
 * Envia via:
 *   1. WhatsApp (Evolution API ou Z-API — configurar ENV)
 *   2. E-mail via Resend (opcional)
 */
cron.schedule(
  "0 23 * * *",
  async () => {
    console.log("[RESUMO NOTURNO] Gerando...")
    try {
      const unidades = await prisma.unidade.findMany({ where: { ativo: true } })
      for (const unidade of unidades) {
        await enviarResumoUnidade(unidade.id, unidade.nome)
      }
    } catch (err) {
      console.error("[RESUMO NOTURNO] Erro:", err)
    }
  },
  { timezone: "America/Fortaleza" }
)

async function enviarResumoUnidade(unidadeId: string, nomeUnidade: string) {
  const hoje = {
    gte: startOfDay(new Date()),
    lte: endOfDay(new Date()),
  }

  const pedidos = await prisma.pedido.findMany({
    where: { unidadeId, criadoEm: hoje, statusPagamento: "APROVADO" },
    include: { itens: true },
  })

  if (pedidos.length === 0) {
    console.log(`[RESUMO NOTURNO] ${nomeUnidade}: sem vendas hoje.`)
    return
  }

  const totalBruto = pedidos.reduce((a, p) => a + Number(p.total), 0)
  const totalPix = pedidos.filter((p) => p.formaPagamento === "PIX").reduce((a, p) => a + Number(p.total), 0)
  const totalCartao = pedidos.filter((p) => p.formaPagamento === "CARTAO_ONLINE").reduce((a, p) => a + Number(p.total), 0)
  const totalPresencial = pedidos.filter((p) => ["DINHEIRO", "CARTAO_PRESENCIAL"].includes(p.formaPagamento)).reduce((a, p) => a + Number(p.total), 0)
  const ticketMedio = totalBruto / pedidos.length

  // Top 3 produtos do dia
  const contagem: Record<string, number> = {}
  pedidos.forEach((p) => p.itens.forEach((i) => { contagem[i.nome] = (contagem[i.nome] ?? 0) + i.quantidade }))
  const top3 = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const dataHoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR })
  const diaSemana = format(new Date(), "EEEE", { locale: ptBR })

  const mensagem = `
🍣 *Resumo ${nomeUnidade}*
📅 ${diaSemana}, ${dataHoje}

💰 *Total: R$ ${totalBruto.toFixed(2).replace(".", ",")}*
📦 Pedidos: ${pedidos.length}
🎯 Ticket médio: R$ ${ticketMedio.toFixed(2).replace(".", ",")}

💳 *Por forma de pagamento:*
• Pix: R$ ${totalPix.toFixed(2).replace(".", ",")}
• Cartão online: R$ ${totalCartao.toFixed(2).replace(".", ",")}
• Presencial: R$ ${totalPresencial.toFixed(2).replace(".", ",")}

🏆 *Top 3 do dia:*
${top3.map((([nome, qtd], i) => `${i + 1}. ${nome} (${qtd}x)`)).join("\n")}

_Gerado automaticamente às 23h_
`.trim()

  console.log(`[RESUMO NOTURNO] ${nomeUnidade}:\n${mensagem}`)

  // ── Envio via WhatsApp (Evolution API) ──────────────────────
  const whatsappNumero = process.env.RESUMO_WHATSAPP_NUMERO
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_INSTANCE

  if (whatsappNumero && evolutionUrl && evolutionKey && evolutionInstance) {
    try {
      await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionKey,
        },
        body: JSON.stringify({
          number: whatsappNumero,
          text: mensagem,
        }),
      })
      console.log(`[RESUMO NOTURNO] WhatsApp enviado para ${whatsappNumero}`)
    } catch (err) {
      console.error("[RESUMO NOTURNO] Erro ao enviar WhatsApp:", err)
    }
  }

  // ── Envio via E-mail (Resend) ────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY
  const emailDestino = process.env.RESUMO_EMAIL_DESTINO

  if (resendKey && emailDestino) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: `Yanni Sushi <noreply@yannisushi.com.br>`,
          to: emailDestino,
          subject: `Resumo ${dataHoje} — ${nomeUnidade}`,
          text: mensagem,
          html: mensagem.replace(/\n/g, "<br>").replace(/\*(.*?)\*/g, "<strong>$1</strong>"),
        }),
      })
      console.log(`[RESUMO NOTURNO] E-mail enviado para ${emailDestino}`)
    } catch (err) {
      console.error("[RESUMO NOTURNO] Erro ao enviar e-mail:", err)
    }
  }
}

console.log("[RESUMO NOTURNO] Cron agendado — 23:00 America/Fortaleza")
