"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Loader2, TrendingUp, Package, Star } from "lucide-react"

interface RankingItem {
  nome: string
  quantidade: number
  receita: number
  custo: number
  lucro: number
  cmv: number
}

interface Resumo {
  totalPedidos: number
  receitaTotal: number
}

const UNIDADE = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"
const PERIODOS = [
  { label: "Hoje", dias: 1 },
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
]

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState(7)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [periodo])

  async function carregar() {
    setLoading(true)
    const [r1, r2] = await Promise.all([
      fetch(`/api/relatorios?unidadeId=${UNIDADE}&tipo=ranking&dias=${periodo}`),
      fetch(`/api/relatorios?unidadeId=${UNIDADE}&tipo=resumo&dias=${periodo}`),
    ])
    const d1 = await r1.json()
    const d2 = await r2.json()
    setRanking(d1.ranking ?? [])
    setResumo(d2)
    setLoading(false)
  }

  const cmvMedio = ranking.length > 0
    ? ranking.reduce((a, r) => a + r.cmv, 0) / ranking.length
    : 0

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--yanni-text)" }}>
            Relatórios
          </h1>
          <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>Desempenho e análise de vendas</p>
        </div>

        {/* Seletor de período */}
        <div style={{ display: "flex", gap: 8 }}>
          {PERIODOS.map(({ label, dias }) => (
            <button key={dias} onClick={() => setPeriodo(dias)}
              style={{
                padding: "8px 16px", fontSize: 12,
                background: periodo === dias ? "var(--yanni-red)" : "var(--yanni-surface)",
                border: `1px solid ${periodo === dias ? "var(--yanni-red)" : "var(--yanni-border)"}`,
                color: periodo === dias ? "#fff" : "var(--yanni-muted)",
                cursor: "pointer", transition: "all 0.2s",
                fontFamily: "var(--font-body)",
              }}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
          <Loader2 size={24} color="var(--yanni-red)" style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Receita total", valor: `R$ ${Number(resumo?.receitaTotal ?? 0).toFixed(2).replace(".", ",")}`, icon: TrendingUp, cor: "var(--yanni-red)" },
              { label: "Total de pedidos", valor: String(resumo?.totalPedidos ?? 0), icon: Package, cor: "var(--yanni-gold)" },
              { label: "CMV médio", valor: `${cmvMedio.toFixed(1)}%`, icon: Star, cor: cmvMedio > 40 ? "var(--yanni-red)" : "#4CAF50" },
            ].map(({ label, valor, icon: Icon, cor }) => (
              <div key={label} style={{
                background: "var(--yanni-surface)",
                border: "1px solid var(--yanni-border)",
                padding: "22px 24px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <Icon size={18} color={cor} />
                <p style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--yanni-text)" }}>
                  {valor}
                </p>
                <p style={{ fontSize: 12, color: "var(--yanni-muted)" }}>{label} — {periodo === 1 ? "hoje" : `últimos ${periodo} dias`}</p>
              </div>
            ))}
          </div>

          {/* Gráfico de receita por produto */}
          <div style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            padding: "24px",
            marginBottom: 24,
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 24 }}>
              Receita por produto (top 10)
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ranking.slice(0, 10)} margin={{ top: 0, right: 0, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="nome"
                  tick={{ fill: "rgba(240,237,232,0.45)", fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "rgba(240,237,232,0.45)", fontSize: 11 }}
                  tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 0,
                    color: "#F0EDE8",
                    fontSize: 12,
                  }}
                  formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, ""]}
                />
                <Bar dataKey="receita" fill="#C8102E" name="Receita" radius={[2, 2, 0, 0]} />
                <Bar dataKey="lucro" fill="rgba(200,16,46,0.3)" name="Lucro" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela de ranking detalhada */}
          <div style={{ background: "var(--yanni-surface)", border: "1px solid var(--yanni-border)", padding: 24 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 20 }}>
              Ranking detalhado
            </h2>
            <div style={{
              display: "grid", gridTemplateColumns: "32px 1fr 80px 110px 110px 110px 80px",
              gap: 16, padding: "10px 0",
              borderBottom: "1px solid var(--yanni-border)",
              fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
              textTransform: "uppercase", color: "var(--yanni-muted)",
            }}>
              <span>#</span><span>Produto</span><span>Qtd</span>
              <span>Receita</span><span>Custo</span><span>Lucro</span><span>CMV %</span>
            </div>
            {ranking.map((r, i) => (
              <div key={r.nome} style={{
                display: "grid", gridTemplateColumns: "32px 1fr 80px 110px 110px 110px 80px",
                gap: 16, padding: "12px 0",
                borderBottom: "1px solid var(--yanni-border)",
                alignItems: "center",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: i === 0 ? "#fff" : "var(--yanni-muted)",
                  background: i === 0 ? "var(--yanni-red)" : "transparent",
                  width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: "var(--yanni-text)" }}>{r.nome}</span>
                <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>{r.quantidade}×</span>
                <span style={{ fontSize: 13, color: "var(--yanni-text)" }}>
                  R$ {r.receita.toFixed(2).replace(".", ",")}
                </span>
                <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>
                  R$ {r.custo.toFixed(2).replace(".", ",")}
                </span>
                <span style={{ fontSize: 13, color: "#4CAF50" }}>
                  R$ {r.lucro.toFixed(2).replace(".", ",")}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: r.cmv > 40 ? "var(--yanni-red)" : r.cmv > 30 ? "var(--yanni-gold)" : "#4CAF50",
                }}>{r.cmv.toFixed(1)}%</span>
              </div>
            ))}
            {ranking.length === 0 && (
              <p style={{ color: "var(--yanni-muted)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                Sem vendas no período selecionado
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
