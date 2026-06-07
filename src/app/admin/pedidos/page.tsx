"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, RefreshCw, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface Pedido {
  id: string
  numero: number
  status: string
  tipo: string
  clienteNome?: string
  total: number
  formaPagamento: string
  criadoEm: string
  itens: { nome: string; quantidade: number; observacao?: string }[]
}

const COLUNAS = [
  { status: "PAGO",        label: "Pagos",      cor: "#4CAF50" },
  { status: "EM_PREPARO",  label: "Em preparo", cor: "var(--yanni-gold)" },
  { status: "PRONTO",      label: "Prontos",    cor: "#2196F3" },
  { status: "SAIU_ENTREGA",label: "Na rua",     cor: "#9C27B0" },
]

const PROXIMO: Record<string, string> = {
  PAGO: "EM_PREPARO",
  EM_PREPARO: "PRONTO",
  PRONTO: "SAIU_ENTREGA",
  SAIU_ENTREGA: "ENTREGUE",
}

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const res = await fetch("/api/pedidos?unidadeId=" + process.env.NEXT_PUBLIC_UNIDADE_SLUG)
    const data = await res.json()
    setPedidos(data.pedidos ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
    const interval = setInterval(carregar, 15000)
    return () => clearInterval(interval)
  }, [carregar])

  async function avancarStatus(pedido: Pedido) {
    const prox = PROXIMO[pedido.status]
    if (!prox) return
    setAtualizando(pedido.id)
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: prox }),
      })
      if (!res.ok) throw new Error()
      setPedidos((prev) => prev.map((p) => p.id === pedido.id ? { ...p, status: prox } : p))
      toast.success(`Pedido #${pedido.numero} → ${STATUS_LABEL[prox] ?? prox}`)
    } catch {
      toast.error("Erro ao atualizar status")
    } finally {
      setAtualizando(null)
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={24} color="var(--yanni-red)" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--yanni-text)" }}>
            Pedidos
          </h1>
          <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>
            Atualiza automaticamente a cada 15 segundos
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

      {/* Kanban */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        alignItems: "start",
      }}>
        {COLUNAS.map(({ status, label, cor }) => {
          const col = pedidos.filter((p) => p.status === status)
          return (
            <div key={status}>
              {/* Header coluna */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 12, padding: "0 4px",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} />
                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--yanni-muted)" }}>
                  {label}
                </span>
                <span style={{
                  marginLeft: "auto",
                  background: "var(--yanni-surface)",
                  border: "1px solid var(--yanni-border)",
                  padding: "1px 8px",
                  fontSize: 11, color: "var(--yanni-muted)",
                }}>{col.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.length === 0 && (
                  <div style={{
                    padding: "24px 16px",
                    background: "var(--yanni-surface)",
                    border: "1px dashed var(--yanni-border)",
                    textAlign: "center",
                  }}>
                    <p style={{ fontSize: 12, color: "var(--yanni-muted)" }}>Vazio</p>
                  </div>
                )}
                {col.map((p) => (
                  <div key={p.id} style={{
                    background: "var(--yanni-surface)",
                    border: "1px solid var(--yanni-border)",
                    padding: 16,
                  }}>
                    {/* Número e tipo */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--yanni-text)" }}>
                        #{p.numero}
                      </span>
                      <span style={{ fontSize: 10, letterSpacing: ".08em", color: cor, border: `1px solid ${cor}40`, padding: "2px 6px" }}>
                        {p.tipo}
                      </span>
                    </div>

                    {/* Cliente */}
                    {p.clienteNome && (
                      <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginBottom: 8 }}>
                        {p.clienteNome}
                      </p>
                    )}

                    {/* Itens */}
                    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      {p.itens.slice(0, 4).map((item, i) => (
                        <p key={i} style={{ fontSize: 12, color: "var(--yanni-text)" }}>
                          {item.quantidade}× {item.nome}
                          {item.observacao && (
                            <span style={{ color: "var(--yanni-muted)", fontSize: 11 }}> · {item.observacao}</span>
                          )}
                        </p>
                      ))}
                      {p.itens.length > 4 && (
                        <p style={{ fontSize: 11, color: "var(--yanni-muted)" }}>+{p.itens.length - 4} mais</p>
                      )}
                    </div>

                    {/* Horário e valor */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "var(--yanni-muted)" }}>
                        {format(new Date(p.criadoEm), "HH:mm", { locale: ptBR })}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--yanni-text)" }}>
                        R$ {Number(p.total).toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    {/* Ações */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {PROXIMO[p.status] && (
                        <button
                          onClick={() => avancarStatus(p)}
                          disabled={atualizando === p.id}
                          className="btn-primary"
                          style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "8px 12px" }}
                        >
                          {atualizando === p.id
                            ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                            : `→ ${STATUS_LABEL[PROXIMO[p.status]]}`
                          }
                        </button>
                      )}
                      <button style={{
                        background: "var(--yanni-surface-2)",
                        border: "1px solid var(--yanni-border)",
                        padding: "8px", cursor: "pointer",
                        color: "var(--yanni-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Printer size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  SAIU_ENTREGA: "Na rua",
  ENTREGUE: "Entregue",
}
