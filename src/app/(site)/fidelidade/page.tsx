"use client"

import { useState } from "react"
import { Star, Gift, History, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Cliente {
  id: string
  nome?: string
  telefone: string
  pontos: number
}

interface Historico {
  tipo: string
  pontos: number
  criadoEm: string
}

export default function FidelidadePage() {
  const [telefone, setTelefone] = useState("")
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [historico, setHistorico] = useState<Historico[]>([])
  const [loading, setLoading] = useState(false)

  async function buscar() {
    if (!telefone) { toast.error("Informe seu telefone"); return }
    setLoading(true)
    const res = await fetch(`/api/clientes?telefone=${telefone.replace(/\D/g, "")}`)
    if (res.ok) {
      const d = await res.json()
      setCliente(d.cliente)
      setHistorico(d.historico ?? [])
    } else {
      toast.error("Telefone não encontrado. Faça um pedido para se cadastrar automaticamente!")
      setCliente(null)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--yanni-black)",
      paddingTop: 96, paddingBottom: 80,
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            width: 56, height: 56,
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.3)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Star size={24} color="var(--yanni-gold)" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 300,
            color: "var(--yanni-text)",
            marginBottom: 12,
          }}>Programa de pontos</h1>
          <p style={{ fontSize: 14, color: "var(--yanni-muted)", lineHeight: 1.7 }}>
            A cada R$ 1,00 em pedidos, você acumula pontos.<br />
            Troque por descontos na próxima compra.
          </p>
        </div>

        {/* Busca */}
        {!cliente ? (
          <div style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            padding: 32,
          }}>
            <label style={{
              fontSize: 11, fontWeight: 500, letterSpacing: ".1em",
              textTransform: "uppercase", color: "var(--yanni-muted)",
              display: "block", marginBottom: 8,
            }}>
              Seu WhatsApp / telefone
            </label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              type="tel"
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              style={{
                width: "100%",
                background: "var(--yanni-surface-2)",
                border: "1px solid var(--yanni-border)",
                padding: "12px 16px",
                color: "var(--yanni-text)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                outline: "none",
                marginBottom: 16,
              }}
            />
            <button onClick={buscar} disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
              {loading ? "Buscando..." : "Ver meus pontos"}
            </button>
          </div>
        ) : (
          <>
            {/* Saldo */}
            <div style={{
              background: "var(--yanni-surface)",
              border: "1px solid rgba(201,168,76,0.2)",
              padding: "36px 32px",
              textAlign: "center",
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--yanni-muted)", marginBottom: 12 }}>
                {cliente.nome ?? "Seu saldo"}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 72, fontWeight: 300,
                  color: "var(--yanni-gold)",
                  lineHeight: 1,
                }}>{cliente.pontos}</span>
                <span style={{ fontSize: 18, color: "var(--yanni-muted)" }}>pts</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--yanni-muted)" }}>
                {cliente.pontos >= 100
                  ? `Você tem ${Math.floor(cliente.pontos / 100)} desconto${Math.floor(cliente.pontos / 100) > 1 ? "s" : ""} disponível${Math.floor(cliente.pontos / 100) > 1 ? "s" : ""} de R$ 5,00`
                  : `Faltam ${100 - (cliente.pontos % 100)} pontos para R$ 5,00 de desconto`
                }
              </p>
            </div>

            {/* Como funciona */}
            <div style={{
              background: "var(--yanni-surface)",
              border: "1px solid var(--yanni-border)",
              padding: 24,
              marginBottom: 20,
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 400, color: "var(--yanni-text)" }}>
                Como funciona
              </h2>
              {[
                { icon: Star, texto: "1 ponto a cada R$ 1,00 em pedidos" },
                { icon: Gift, texto: "100 pontos = R$ 5,00 de desconto" },
                { icon: History, texto: "Resgate automático no checkout" },
              ].map(({ icon: Icon, texto }) => (
                <div key={texto} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon size={16} color="var(--yanni-gold)" />
                  <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>{texto}</span>
                </div>
              ))}
            </div>

            {/* Histórico */}
            {historico.length > 0 && (
              <div style={{ background: "var(--yanni-surface)", border: "1px solid var(--yanni-border)", padding: 24 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 400, color: "var(--yanni-text)", marginBottom: 16 }}>
                  Histórico
                </h2>
                {historico.slice(0, 10).map((h, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < historico.length - 1 ? "1px solid var(--yanni-border)" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--yanni-muted)" }}>
                      {h.tipo === "GANHO" ? "Pedido concluído" : h.tipo === "RESGATADO" ? "Desconto resgatado" : "Ajuste"}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 500,
                      color: h.pontos > 0 ? "var(--yanni-gold)" : "var(--yanni-red)",
                    }}>
                      {h.pontos > 0 ? "+" : ""}{h.pontos} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setCliente(null)} className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
              Buscar outro número
            </button>
          </>
        )}
      </div>
    </div>
  )
}
