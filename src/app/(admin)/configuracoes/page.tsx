"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface Config {
  nomeExibicao: string
  mensagemChef: string
  taxaEntrega: number
  pedidoMinimo: number
  programaPontos: boolean
  pontosPorReal: number
  pontosParaDesconto: number
  descontoPontos: number
  aceitaPagPresencial: boolean
}

const UNIDADE = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch(`/api/configuracoes?unidadeSlug=${UNIDADE}`)
      .then((r) => r.json())
      .then((d) => { setConfig(d.config); setLoading(false) })
  }, [])

  async function salvar() {
    if (!config) return
    setSalvando(true)
    const res = await fetch("/api/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unidadeSlug: UNIDADE, ...config }),
    })
    if (res.ok) toast.success("Configurações salvas!")
    else toast.error("Erro ao salvar configurações")
    setSalvando(false)
  }

  if (loading || !config) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={24} color="var(--yanni-red)" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  const set = (k: keyof Config, v: any) => setConfig((c) => c ? { ...c, [k]: v } : c)

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--yanni-text)" }}>
            Configurações
          </h1>
          <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>Dados gerais da unidade</p>
        </div>
        <button onClick={salvar} disabled={salvando} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {salvando ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={14} />}
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Seções */}
      {[
        {
          titulo: "Informações gerais",
          campos: [
            { label: "Nome de exibição", key: "nomeExibicao", type: "text" },
            { label: "Mensagem do chef (exibida na home)", key: "mensagemChef", type: "text" },
          ],
        },
        {
          titulo: "Entrega e pagamento",
          campos: [
            { label: "Taxa de entrega (R$)", key: "taxaEntrega", type: "number" },
            { label: "Pedido mínimo (R$)", key: "pedidoMinimo", type: "number" },
          ],
        },
        {
          titulo: "Programa de pontos",
          campos: [
            { label: "Pontos por R$ 1,00 gasto", key: "pontosPorReal", type: "number" },
            { label: "Pontos necessários para desconto", key: "pontosParaDesconto", type: "number" },
            { label: "Valor do desconto (R$)", key: "descontoPontos", type: "number" },
          ],
        },
      ].map(({ titulo, campos }) => (
        <div key={titulo} style={{
          background: "var(--yanni-surface)",
          border: "1px solid var(--yanni-border)",
          padding: 28,
          marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 20 }}>
            {titulo}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {campos.map(({ label, key, type }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type}
                  value={String((config as any)[key])}
                  onChange={(e) => set(key as keyof Config, type === "number" ? Number(e.target.value) : e.target.value)}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Toggles */}
      <div style={{
        background: "var(--yanni-surface)",
        border: "1px solid var(--yanni-border)",
        padding: 28,
      }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 20 }}>
          Funcionalidades
        </h2>
        {[
          { key: "programaPontos", label: "Programa de pontos ativo" },
          { key: "aceitaPagPresencial", label: "Aceitar pagamento na entrega / retirada" },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={(config as any)[key]}
              onChange={(e) => set(key as keyof Config, e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--yanni-red)" }}
            />
            <span style={{ fontSize: 14, color: "var(--yanni-text)" }}>{label}</span>
          </label>
        ))}
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
