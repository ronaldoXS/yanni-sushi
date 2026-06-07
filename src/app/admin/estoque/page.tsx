"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Plus, Minus, RefreshCw, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProdutoEstoque {
  id: string
  nome: string
  imagemUrl?: string
  estoqueAtual: number
  estoqueMinimo: number
  disponivel: boolean
  categoria: { nome: string }
}

const UNIDADE = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [alertas, setAlertas] = useState<ProdutoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [ajustando, setAjustando] = useState<string | null>(null)
  const [modal, setModal] = useState<{ produto: ProdutoEstoque; tipo: "ENTRADA" | "SAIDA_AJUSTE" | "INVENTARIO" } | null>(null)
  const [qtd, setQtd] = useState("")
  const [motivo, setMotivo] = useState("")

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [r1, r2] = await Promise.all([
      fetch(`/api/estoque?unidadeId=${UNIDADE}`),
      fetch(`/api/estoque?unidadeId=${UNIDADE}&tipo=alertas`),
    ])
    const d1 = await r1.json()
    const d2 = await r2.json()
    setProdutos(d1.produtos ?? [])
    setAlertas(d2.alertas ?? [])
    setLoading(false)
  }

  async function salvarAjuste() {
    if (!modal || !qtd) { toast.error("Informe a quantidade"); return }
    setAjustando(modal.produto.id)
    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produtoId: modal.produto.id,
        quantidade: Number(qtd),
        tipo: modal.tipo,
        motivo,
      }),
    })
    if (res.ok) {
      const d = await res.json()
      setProdutos((prev) => prev.map((p) => p.id === d.produto.id ? { ...p, estoqueAtual: d.produto.estoqueAtual } : p))
      toast.success(`Estoque atualizado: ${d.produto.nome}`)
      setModal(null)
      setQtd("")
      setMotivo("")
      await carregar()
    } else {
      toast.error("Erro ao ajustar estoque")
    }
    setAjustando(null)
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
            Estoque
          </h1>
          <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>
            {produtos.length} produtos com controle · {alertas.length} alertas
          </p>
        </div>
        <button onClick={carregar} style={{
          background: "none", border: "1px solid var(--yanni-border)",
          padding: "8px 14px", cursor: "pointer",
          color: "var(--yanni-muted)", display: "flex", alignItems: "center", gap: 8, fontSize: 13,
        }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{
          background: "rgba(200,16,46,0.06)",
          border: "1px solid rgba(200,16,46,0.2)",
          padding: "16px 20px",
          marginBottom: 28,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <AlertTriangle size={18} color="var(--yanni-red)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--yanni-red)", marginBottom: 6 }}>
              {alertas.length} produto{alertas.length > 1 ? "s" : ""} abaixo do estoque mínimo
            </p>
            <p style={{ fontSize: 12, color: "var(--yanni-muted)" }}>
              {alertas.map((a) => `${a.nome} (${a.estoqueAtual}/${a.estoqueMinimo})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: "var(--yanni-surface)", border: "1px solid var(--yanni-border)" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 120px 100px 120px 120px",
          gap: 16, padding: "12px 20px",
          borderBottom: "1px solid var(--yanni-border)",
          fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
          textTransform: "uppercase", color: "var(--yanni-muted)",
        }}>
          <span>Produto</span><span>Categoria</span>
          <span>Atual</span><span>Mínimo</span><span>Ações</span>
        </div>

        {produtos.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--yanni-muted)" }}>
            <Package size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: 13 }}>Nenhum produto com controle de estoque ativado</p>
          </div>
        )}

        {produtos.map((p) => {
          const alerta = p.estoqueAtual <= p.estoqueMinimo
          return (
            <div key={p.id} style={{
              display: "grid", gridTemplateColumns: "1fr 120px 100px 120px 120px",
              gap: 16, padding: "14px 20px",
              borderBottom: "1px solid var(--yanni-border)",
              alignItems: "center",
              background: alerta ? "rgba(200,16,46,0.04)" : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {alerta && <AlertTriangle size={14} color="var(--yanni-red)" />}
                <p style={{ fontSize: 13, color: "var(--yanni-text)" }}>{p.nome}</p>
              </div>
              <span style={{ fontSize: 12, color: "var(--yanni-muted)" }}>{p.categoria.nome}</span>
              <span style={{
                fontSize: 16, fontWeight: 500,
                color: alerta ? "var(--yanni-red)" : "var(--yanni-text)",
              }}>{p.estoqueAtual}</span>
              <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>{p.estoqueMinimo}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setModal({ produto: p, tipo: "ENTRADA" }); setQtd("") }}
                  style={{ ...btnSmall, color: "#4CAF50", borderColor: "rgba(76,175,80,0.3)" }}
                  title="Entrada"
                ><Plus size={13} /></button>
                <button
                  onClick={() => { setModal({ produto: p, tipo: "SAIDA_AJUSTE" }); setQtd("") }}
                  style={{ ...btnSmall, color: "var(--yanni-muted)" }}
                  title="Saída / Ajuste"
                ><Minus size={13} /></button>
                <button
                  onClick={() => { setModal({ produto: p, tipo: "INVENTARIO" }); setQtd("") }}
                  style={{ ...btnSmall, color: "#2196F3", borderColor: "rgba(33,150,243,0.3)" }}
                  title="Inventário"
                ><RefreshCw size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de ajuste */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 24,
        }}>
          <div style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            width: "100%", maxWidth: 400, padding: 32,
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 6 }}>
              {modal.tipo === "ENTRADA" ? "Entrada de estoque" : modal.tipo === "INVENTARIO" ? "Inventário" : "Saída / Ajuste"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginBottom: 24 }}>{modal.produto.nome}</p>

            <label style={labelStyle}>
              {modal.tipo === "INVENTARIO" ? "Quantidade atual real" : "Quantidade"}
            </label>
            <input type="number" min="1" value={qtd} onChange={(e) => setQtd(e.target.value)}
              placeholder="0" style={{ ...inputStyle, marginTop: 6, marginBottom: 16 }} />
            <label style={labelStyle}>Motivo (opcional)</label>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Recebimento NF 1234, quebra, etc." style={{ ...inputStyle, marginTop: 6, marginBottom: 24 }} />

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Cancelar
              </button>
              <button onClick={salvarAjuste} disabled={!!ajustando} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {ajustando ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {ajustando ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const btnSmall: React.CSSProperties = {
  width: 28, height: 28,
  background: "var(--yanni-surface-2)",
  border: "1px solid var(--yanni-border)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", transition: "all 0.15s",
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
