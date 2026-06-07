import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"
import { TrendingUp, ShoppingBag, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getDashboardData(unidadeSlug: string) {
  const unidade = await prisma.unidade.findUnique({ where: { slug: unidadeSlug } })
  if (!unidade) return null

  const hoje = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) }

  const [pedidosHoje, pedidosAbertos, receitaHoje, topProdutos] = await Promise.all([
    prisma.pedido.count({ where: { unidadeId: unidade.id, criadoEm: hoje } }),
    prisma.pedido.findMany({
      where: {
        unidadeId: unidade.id,
        status: { in: ["PAGO", "EM_PREPARO", "PRONTO"] },
      },
      include: { itens: true },
      orderBy: { criadoEm: "desc" },
      take: 20,
    }),
    prisma.pedido.aggregate({
      where: { unidadeId: unidade.id, criadoEm: hoje, statusPagamento: "APROVADO" },
      _sum: { total: true },
    }),
    prisma.itemPedido.groupBy({
      by: ["nome"],
      where: { pedido: { unidadeId: unidade.id, criadoEm: hoje } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 5,
    }),
  ])

  return { pedidosHoje, pedidosAbertos, receitaHoje, topProdutos }
}

export default async function DashboardPage() {
  const slug = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"
  const data = await getDashboardData(slug)
  if (!data) return <p style={{ color: "var(--yanni-muted)" }}>Unidade não configurada.</p>

  const { pedidosHoje, pedidosAbertos, receitaHoje, topProdutos } = data
  const receita = Number(receitaHoje._sum.total ?? 0)

  const kpis = [
    { label: "Receita hoje", valor: `R$ ${receita.toFixed(2).replace(".", ",")}`, icon: TrendingUp, cor: "var(--yanni-red)" },
    { label: "Pedidos hoje", valor: String(pedidosHoje), icon: ShoppingBag, cor: "var(--yanni-gold)" },
    { label: "Em aberto", valor: String(pedidosAbertos.length), icon: Clock, cor: "#2196F3" },
    { label: "Ticket médio", valor: pedidosHoje > 0 ? `R$ ${(receita / pedidosHoje).toFixed(2).replace(".", ",")}` : "—", icon: CheckCircle, cor: "#4CAF50" },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--yanni-muted)", marginBottom: 6 }}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, color: "var(--yanni-text)" }}>
          Bom dia, Yanni
        </h1>
      </div>

      {/* KPIs */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 40,
      }}>
        {kpis.map(({ label, valor, icon: Icon, cor }) => (
          <div key={label} style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            padding: "24px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <Icon size={20} color={cor} />
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: "var(--yanni-text)" }}>
                {valor}
              </p>
              <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginTop: 4 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

        {/* Pedidos em aberto */}
        <div style={{
          background: "var(--yanni-surface)",
          border: "1px solid var(--yanni-border)",
          padding: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)" }}>
              Pedidos em aberto
            </h2>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: "var(--yanni-red)", textDecoration: "none" }}>
              Ver todos →
            </Link>
          </div>

          {pedidosAbertos.length === 0 ? (
            <p style={{ color: "var(--yanni-muted)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
              Nenhum pedido em aberto
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {pedidosAbertos.map((p) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--yanni-border)",
                }}>
                  <div>
                    <p style={{ fontSize: 14, color: "var(--yanni-text)", fontWeight: 500 }}>
                      #{p.numero} · {p.clienteNome ?? "Cliente"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginTop: 2 }}>
                      {p.itens.length} iten{p.itens.length > 1 ? "s" : "s"} ·{" "}
                      {format(new Date(p.criadoEm), "HH:mm")}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top produtos */}
        <div style={{
          background: "var(--yanni-surface)",
          border: "1px solid var(--yanni-border)",
          padding: "24px",
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 20 }}>
            Mais vendidos hoje
          </h2>
          {topProdutos.length === 0 ? (
            <p style={{ color: "var(--yanni-muted)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
              Sem vendas ainda
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProdutos.map((p, i) => (
                <div key={p.nome} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 24, height: 24,
                    background: i === 0 ? "var(--yanni-red)" : "var(--yanni-surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 500,
                    color: i === 0 ? "#fff" : "var(--yanni-muted)",
                    flexShrink: 0,
                  }}>{i + 1}</span>
                  <p style={{ flex: 1, fontSize: 13, color: "var(--yanni-text)" }}>{p.nome}</p>
                  <span style={{ fontSize: 13, color: "var(--yanni-muted)", fontWeight: 500 }}>
                    {p._sum.quantidade ?? 0}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cor: string }> = {
    PAGO: { label: "Pago", cor: "#4CAF50" },
    EM_PREPARO: { label: "Em preparo", cor: "var(--yanni-gold)" },
    PRONTO: { label: "Pronto", cor: "#2196F3" },
  }
  const s = map[status] ?? { label: status, cor: "var(--yanni-muted)" }
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      color: s.cor,
      border: `1px solid ${s.cor}40`,
      padding: "3px 10px",
      letterSpacing: ".06em",
    }}>{s.label}</span>
  )
}
