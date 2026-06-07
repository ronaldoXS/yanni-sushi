"use client"

import { useEffect, useState } from "react"
import { Wallet, TrendingUp, CreditCard, Banknote, QrCode, Loader2, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Caixa {
  id: string
  status: "ABERTO" | "FECHADO"
  dataAbertura: string
  dataFechamento?: string
  saldoInicial: number
  saldoFinal?: number
  totalVendas?: number
  totalPix?: number
  totalCartao?: number
  totalDinheiro?: number
  observacoes?: string
}

const UNIDADE = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"

export default function FinanceiroPage() {
  const [caixaAberto, setCaixaAberto] = useState<Caixa | null>(null)
  const [historico, setHistorico] = useState<Caixa[]>([])
  const [loading, setLoading] = useState(true)
  const [saldoInicial, setSaldoInicial] = useState("")
  const [saldoFinal, setSaldoFinal] = useState("")
  const [obs, setObs] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [r1, r2] = await Promise.all([
      fetch(`/api/caixa?unidadeId=${UNIDADE}&tipo=aberto`),
      fetch(`/api/caixa?unidadeId=${UNIDADE}&tipo=historico`),
    ])
    const d1 = await r1.json()
    const d2 = await r2.json()
    setCaixaAberto(d1.caixa ?? null)
    setHistorico(d2.historico ?? [])
    setLoading(false)
  }

  async function abrirCaixa() {
    if (!saldoInicial) { toast.error("Informe o saldo inicial"); return }
    setSalvando(true)
    const res = await fetch("/api/caixa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unidadeId: UNIDADE, saldoInicial: Number(saldoInicial) }),
    })
    if (res.ok) {
      toast.success("Caixa aberto!")
      setSaldoInicial("")
      await carregar()
    } else {
      const d = await res.json()
      toast.error(d.erro ?? "Erro ao abrir caixa")
    }
    setSalvando(false)
  }

  async function fecharCaixa() {
    if (!caixaAberto) return
    if (!saldoFinal) { toast.error("Informe o saldo final"); return }
    setSalvando(true)
    const res = await fetch("/api/caixa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caixaId: caixaAberto.id, saldoFinal: Number(saldoFinal), observacoes: obs }),
    })
    if (res.ok) {
      toast.success("Caixa fechado com sucesso!")
      setSaldoFinal("")
      setObs("")
      await carregar()
    } else {
      toast.error("Erro ao fechar caixa")
    }
    setSalvando(false)
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={24} color="var(--yanni-red)" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--yanni-text)" }}>
          Financeiro
        </h1>
        <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>
          Caixa, conciliação e resumo de vendas
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>

        {/* Status do caixa */}
        <div style={{
          background: "var(--yanni-surface)",
          border: `1px solid ${caixaAberto ? "rgba(76,175,80,0.3)" : "var(--yanni-border)"}`,
          padding: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {caixaAberto
              ? <Unlock size={20} color="#4CAF50" />
              : <Lock size={20} color="var(--yanni-muted)" />
            }
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)" }}>
              {caixaAberto ? "Caixa aberto" : "Caixa fechado"}
            </h2>
          </div>

          {caixaAberto ? (
            <>
              <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginBottom: 20 }}>
                Aberto em {format(new Date(caixaAberto.dataAbertura), "HH:mm 'de' dd/MM", { locale: ptBR })}
                {" · "}Saldo inicial: R$ {Number(caixaAberto.saldoInicial).toFixed(2).replace(".", ",")}
              </p>
              <label style={labelStyle}>Saldo final em caixa (R$)</label>
              <input value={saldoFinal} onChange={(e) => setSaldoFinal(e.target.value)}
                type="number" step="0.01" placeholder="0,00" style={{ ...inputStyle, marginTop: 6, marginBottom: 12 }} />
              <label style={labelStyle}>Observações</label>
              <textarea value={obs} onChange={(e) => setObs(e.target.value)}
                rows={2} placeholder="Divergências, ocorrências..." style={{ ...inputStyle, marginTop: 6, resize: "vertical", marginBottom: 16 }} />
              <button onClick={fecharCaixa} disabled={salvando} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {salvando ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Lock size={14} />}
                {salvando ? "Fechando..." : "Fechar caixa"}
              </button>
            </>
          ) : (
            <>
              <label style={labelStyle}>Saldo inicial (R$)</label>
              <input value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)}
                type="number" step="0.01" placeholder="0,00" style={{ ...inputStyle, marginTop: 6, marginBottom: 16 }} />
              <button onClick={abrirCaixa} disabled={salvando} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {salvando ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Unlock size={14} />}
                {salvando ? "Abrindo..." : "Abrir caixa"}
              </button>
            </>
          )}
        </div>

        {/* Último fechamento */}
        {historico.length > 0 && (
          <div style={{ background: "var(--yanni-surface)", border: "1px solid var(--yanni-border)", padding: 28 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 20 }}>
              Último fechamento
            </h2>
            {(() => {
              const u = historico[0]
              const cards = [
                { label: "Total vendas", valor: u.totalVendas ?? 0, icon: TrendingUp, cor: "var(--yanni-red)" },
                { label: "Pix", valor: u.totalPix ?? 0, icon: QrCode, cor: "#4CAF50" },
                { label: "Cartão", valor: u.totalCartao ?? 0, icon: CreditCard, cor: "#2196F3" },
                { label: "Dinheiro / Maq.", valor: u.totalDinheiro ?? 0, icon: Banknote, cor: "var(--yanni-gold)" },
              ]
              return (
                <>
                  <p style={{ fontSize: 11, color: "var(--yanni-muted)", marginBottom: 16, letterSpacing: ".05em" }}>
                    {format(new Date(u.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {cards.map(({ label, valor, icon: Icon, cor }) => (
                      <div key={label} style={{
                        background: "var(--yanni-surface-2)",
                        border: "1px solid var(--yanni-border)",
                        padding: "14px 16px",
                      }}>
                        <Icon size={14} color={cor} style={{ marginBottom: 6 }} />
                        <p style={{ fontSize: 15, fontWeight: 500, color: "var(--yanni-text)" }}>
                          R$ {Number(valor).toFixed(2).replace(".", ",")}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--yanni-muted)", marginTop: 2 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* Histórico de caixas */}
      <div style={{ background: "var(--yanni-surface)", border: "1px solid var(--yanni-border)", padding: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 20 }}>
          Histórico de caixas
        </h2>
        {historico.length === 0 ? (
          <p style={{ color: "var(--yanni-muted)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
            Nenhum fechamento registrado
          </p>
        ) : (
          <div>
            <div style={{
              display: "grid", gridTemplateColumns: "140px 1fr 120px 120px 120px 120px",
              gap: 16, padding: "10px 0",
              borderBottom: "1px solid var(--yanni-border)",
              fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
              textTransform: "uppercase", color: "var(--yanni-muted)",
            }}>
              <span>Data</span><span>Período</span>
              <span>Total</span><span>Pix</span><span>Cartão</span><span>Dinheiro</span>
            </div>
            {historico.map((c) => (
              <div key={c.id} style={{
                display: "grid", gridTemplateColumns: "140px 1fr 120px 120px 120px 120px",
                gap: 16, padding: "13px 0",
                borderBottom: "1px solid var(--yanni-border)",
                alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "var(--yanni-text)" }}>
                  {format(new Date(c.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span style={{ fontSize: 12, color: "var(--yanni-muted)" }}>
                  {format(new Date(c.dataAbertura), "HH:mm")} – {c.dataFechamento ? format(new Date(c.dataFechamento), "HH:mm") : "—"}
                </span>
                {[c.totalVendas, c.totalPix, c.totalCartao, c.totalDinheiro].map((v, i) => (
                  <span key={i} style={{ fontSize: 13, color: "var(--yanni-text)", fontWeight: i === 0 ? 500 : 300 }}>
                    R$ {Number(v ?? 0).toFixed(2).replace(".", ",")}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
  textTransform: "uppercase", color: "var(--yanni-muted)", display: "block",
}
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--yanni-surface-2)",
  border: "1px solid var(--yanni-border)",
  padding: "10px 14px", color: "var(--yanni-text)",
  fontFamily: "var(--font-body)", fontSize: 13, outline: "none",
}
