"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Clock, ChefHat, Truck, Package, XCircle } from "lucide-react"
import Link from "next/link"

const STATUS_MAP = {
  AGUARDANDO_PAGAMENTO: { label: "Aguardando pagamento", icon: Clock, cor: "var(--yanni-muted)", step: 0 },
  PAGO: { label: "Pagamento confirmado", icon: CheckCircle, cor: "#4CAF50", step: 1 },
  EM_PREPARO: { label: "Em preparo", icon: ChefHat, cor: "var(--yanni-gold)", step: 2 },
  PRONTO: { label: "Pronto para retirada", icon: Package, cor: "var(--yanni-gold)", step: 3 },
  SAIU_ENTREGA: { label: "Saiu para entrega", icon: Truck, cor: "#2196F3", step: 3 },
  ENTREGUE: { label: "Entregue!", icon: CheckCircle, cor: "#4CAF50", step: 4 },
  CANCELADO: { label: "Cancelado", icon: XCircle, cor: "var(--yanni-red)", step: -1 },
}

type StatusKey = keyof typeof STATUS_MAP

interface PedidoInfo {
  id: string
  numero: number
  status: StatusKey
  tipo: string
  total: number
  clienteNome?: string
  criadoEm: string
  itens: { nome: string; quantidade: number; preco: number }[]
}

export default function PedidoPage() {
  const params = useSearchParams()
  const pedidoId = params.get("id")
  const [pedido, setPedido] = useState<PedidoInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const buscarPedido = useCallback(async () => {
    if (!pedidoId) return
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`)
      if (res.ok) setPedido(await res.json())
    } finally {
      setLoading(false)
    }
  }, [pedidoId])

  useEffect(() => {
    buscarPedido()
    // Polling a cada 10s para atualizar status
    const interval = setInterval(buscarPedido, 10000)
    return () => clearInterval(interval)
  }, [buscarPedido])

  if (!pedidoId) return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <p style={{ color: "var(--yanni-muted)", textAlign: "center", paddingTop: 80 }}>
          Nenhum pedido informado.
        </p>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/cardapio" className="btn-primary">Ver cardápio</Link>
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, border: "2px solid var(--yanni-red)",
          borderTopColor: "transparent", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ color: "var(--yanni-muted)", fontSize: 13 }}>Buscando seu pedido...</p>
      </div>
    </div>
  )

  if (!pedido) return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: "var(--yanni-muted)" }}>Pedido não encontrado.</p>
        <Link href="/cardapio" className="btn-primary" style={{ marginTop: 24, display: "inline-block" }}>
          Fazer pedido
        </Link>
      </div>
    </div>
  )

  const statusInfo = STATUS_MAP[pedido.status] ?? STATUS_MAP.AGUARDANDO_PAGAMENTO
  const StatusIcon = statusInfo.icon
  const steps = ["Pedido recebido", "Em preparo", "Pronto / Saiu", "Entregue"]

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* Número do pedido */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase",
            color: "var(--yanni-red)", marginBottom: 8,
          }}>
            Acompanhamento
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 48, fontWeight: 300,
            color: "var(--yanni-text)",
          }}>
            #{pedido.numero}
          </h1>
          {pedido.clienteNome && (
            <p style={{ color: "var(--yanni-muted)", fontSize: 14, marginTop: 4 }}>
              {pedido.clienteNome}
            </p>
          )}
        </div>

        {/* Status atual */}
        <div style={{
          background: "var(--yanni-surface)",
          border: `1px solid ${statusInfo.cor}40`,
          padding: "28px 24px",
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: 40,
        }}>
          <StatusIcon size={32} color={statusInfo.cor} />
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--yanni-text)" }}>
              {statusInfo.label}
            </p>
            <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginTop: 4 }}>
              Atualizado automaticamente a cada 10 segundos
            </p>
          </div>
        </div>

        {/* Progress steps */}
        {pedido.status !== "CANCELADO" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: 3,
                  background: i < statusInfo.step
                    ? "var(--yanni-red)"
                    : i === statusInfo.step
                    ? "var(--yanni-gold)"
                    : "var(--yanni-border)",
                  marginBottom: 6,
                  transition: "background 0.5s",
                }} />
                <p style={{ fontSize: 10, color: "var(--yanni-muted)", letterSpacing: ".05em" }}>{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Itens do pedido */}
        <div style={{
          background: "var(--yanni-surface)",
          border: "1px solid var(--yanni-border)",
          padding: "20px",
          marginBottom: 24,
        }}>
          <p style={{
            fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase",
            color: "var(--yanni-muted)", marginBottom: 16,
          }}>Itens</p>
          {pedido.itens.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < pedido.itens.length - 1 ? "1px solid var(--yanni-border)" : "none",
            }}>
              <span style={{ fontSize: 13, color: "var(--yanni-text)" }}>
                {item.quantidade}× {item.nome}
              </span>
              <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>
                R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: "var(--yanni-border)", margin: "12px 0 8px" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--yanni-text)" }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--yanni-text)" }}>
              R$ {pedido.total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link href="/cardapio" className="btn-ghost">Fazer novo pedido</Link>
        </div>

      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--yanni-black)",
  paddingTop: 88,
  paddingBottom: 80,
}

const containerStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: "0 auto",
  padding: "0 24px",
}
