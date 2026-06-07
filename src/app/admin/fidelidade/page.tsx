"use client"

import { useEffect, useState } from "react"
import { Plus, Tag, Users, Loader2, X, ToggleRight, ToggleLeft } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Cupom {
  id: string
  codigo: string
  tipo: "PERCENTUAL" | "FIXO"
  valor: number
  pedidoMinimo: number
  usoUnico: boolean
  usado: boolean
  ativo: boolean
  validoAte?: string
  criadoEm: string
}

const UNIDADE = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"

export default function FidelidadePage() {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    codigo: "", tipo: "PERCENTUAL" as "PERCENTUAL" | "FIXO",
    valor: "", pedidoMinimo: "0",
    usoUnico: true, validoAte: "",
  })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const res = await fetch(`/api/cupons?unidadeId=${UNIDADE}`)
    const d = await res.json()
    setCupons(d.cupons ?? [])
    setLoading(false)
  }

  async function criarCupom() {
    if (!form.codigo || !form.valor) { toast.error("Preencha código e valor"); return }
    setSalvando(true)
    const res = await fetch("/api/cupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unidadeId: UNIDADE,
        codigo: form.codigo.toUpperCase(),
        tipo: form.tipo,
        valor: Number(form.valor),
        pedidoMinimo: Number(form.pedidoMinimo),
        usoUnico: form.usoUnico,
        validoAte: form.validoAte || undefined,
      }),
    })
    if (res.ok) {
      toast.success("Cupom criado!")
      setModal(false)
      setForm({ codigo: "", tipo: "PERCENTUAL", valor: "", pedidoMinimo: "0", usoUnico: true, validoAte: "" })
      await carregar()
    } else {
      const d = await res.json()
      toast.error(d.erro ?? "Erro ao criar cupom")
    }
    setSalvando(false)
  }

  async function toggleCupom(cupom: Cupom) {
    await fetch("/api/cupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cupom.id, ativo: !cupom.ativo }),
    })
    setCupons((prev) => prev.map((c) => c.id === cupom.id ? { ...c, ativo: !c.ativo } : c))
    toast.success(cupom.ativo ? "Cupom desativado" : "Cupom ativado")
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={24} color="var(--yanni-red)" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--yanni-text)" }}>
            Fidelidade
          </h1>
          <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>
            Cupons de desconto e programa de pontos
          </p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} /> Novo cupom
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total de cupons", valor: String(cupons.length), icon: Tag },
          { label: "Cupons ativos", valor: String(cupons.filter((c) => c.ativo).length), icon: Tag },
          { label: "Já utilizados", valor: String(cupons.filter((c) => c.usado).length), icon: Users },
        ].map(({ label, valor, icon: Icon }) => (
          <div key={label} style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            padding: "20px 24px",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <Icon size={18} color="var(--yanni-muted)" />
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "var(--yanni-text)" }}>{valor}</p>
              <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginTop: 2 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de cupons */}
      <div style={{ background: "var(--yanni-surface)", border: "1px solid var(--yanni-border)" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "160px 100px 100px 110px 120px 100px 80px",
          gap: 16, padding: "12px 20px",
          borderBottom: "1px solid var(--yanni-border)",
          fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
          textTransform: "uppercase", color: "var(--yanni-muted)",
        }}>
          <span>Código</span><span>Tipo</span><span>Valor</span>
          <span>Mín. pedido</span><span>Validade</span><span>Status</span><span>Ativo</span>
        </div>

        {cupons.length === 0 && (
          <p style={{ color: "var(--yanni-muted)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            Nenhum cupom criado ainda
          </p>
        )}

        {cupons.map((c) => (
          <div key={c.id} style={{
            display: "grid", gridTemplateColumns: "160px 100px 100px 110px 120px 100px 80px",
            gap: 16, padding: "14px 20px",
            borderBottom: "1px solid var(--yanni-border)",
            alignItems: "center",
            opacity: c.ativo ? 1 : 0.5,
          }}>
            <span style={{
              fontFamily: "monospace", fontSize: 13, fontWeight: 500,
              color: "var(--yanni-text)", letterSpacing: ".05em",
            }}>{c.codigo}</span>
            <span style={{ fontSize: 12, color: "var(--yanni-muted)" }}>
              {c.tipo === "PERCENTUAL" ? "%" : "R$"}
            </span>
            <span style={{ fontSize: 13, color: "var(--yanni-text)", fontWeight: 500 }}>
              {c.tipo === "PERCENTUAL" ? `${c.valor}%` : `R$ ${Number(c.valor).toFixed(2).replace(".", ",")}`}
            </span>
            <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>
              R$ {Number(c.pedidoMinimo).toFixed(2).replace(".", ",")}
            </span>
            <span style={{ fontSize: 12, color: "var(--yanni-muted)" }}>
              {c.validoAte ? format(new Date(c.validoAte), "dd/MM/yyyy", { locale: ptBR }) : "Sem limite"}
            </span>
            <span style={{
              fontSize: 11, letterSpacing: ".06em",
              color: c.usado ? "var(--yanni-muted)" : "#4CAF50",
              border: `1px solid ${c.usado ? "var(--yanni-border)" : "rgba(76,175,80,0.3)"}`,
              padding: "2px 8px", display: "inline-block",
            }}>
              {c.usado ? "Usado" : "Disponível"}
            </span>
            <button onClick={() => toggleCupom(c)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              {c.ativo
                ? <ToggleRight size={22} color="var(--yanni-red)" />
                : <ToggleLeft size={22} color="var(--yanni-muted)" />
              }
            </button>
          </div>
        ))}
      </div>

      {/* Modal criar cupom */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 24,
        }}>
          <div style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            width: "100%", maxWidth: 440, padding: 32,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--yanni-text)" }}>
                Novo cupom
              </h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--yanni-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <F label="Código" value={form.codigo} onChange={(v) => setForm(f => ({ ...f, codigo: v.toUpperCase() }))} placeholder="BEMVINDO10" />

              <div>
                <label style={labelStyle}>Tipo de desconto</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {(["PERCENTUAL", "FIXO"] as const).map((t) => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      style={{
                        flex: 1, padding: "10px",
                        background: form.tipo === t ? "var(--yanni-red)" : "var(--yanni-surface-2)",
                        border: `1px solid ${form.tipo === t ? "var(--yanni-red)" : "var(--yanni-border)"}`,
                        color: "var(--yanni-text)", cursor: "pointer", fontSize: 13,
                        fontFamily: "var(--font-body)", transition: "all 0.2s",
                      }}>
                      {t === "PERCENTUAL" ? "Percentual (%)" : "Valor fixo (R$)"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <F label={form.tipo === "PERCENTUAL" ? "Desconto (%)" : "Desconto (R$)"}
                  value={form.valor} onChange={(v) => setForm(f => ({ ...f, valor: v }))} type="number" />
                <F label="Pedido mínimo (R$)" value={form.pedidoMinimo}
                  onChange={(v) => setForm(f => ({ ...f, pedidoMinimo: v }))} type="number" />
              </div>

              <F label="Válido até (opcional)" value={form.validoAte}
                onChange={(v) => setForm(f => ({ ...f, validoAte: v }))} type="date" />

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.usoUnico}
                  onChange={(e) => setForm(f => ({ ...f, usoUnico: e.target.checked }))} />
                <span style={{ fontSize: 13, color: "var(--yanni-text)" }}>Uso único (um uso por código)</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Cancelar
              </button>
              <button onClick={criarCupom} disabled={salvando} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {salvando ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {salvando ? "Criando..." : "Criar cupom"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function F({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} style={{ ...inputStyle, marginTop: 6 }} />
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
