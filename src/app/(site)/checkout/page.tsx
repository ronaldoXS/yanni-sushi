"use client"

import { useState } from "react"
import { useCart } from "@/components/site/CartProvider"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trash2, Plus, Minus, Loader2, CheckCircle, Copy } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import Link from "next/link"

type Tela = 1 | 2 | 3

interface DadosCliente {
  nome: string
  telefone: string
  email: string
  tipo: "DELIVERY" | "RETIRADA"
  endereco: string
}

interface DadosPagamento {
  forma: "PIX" | "CARTAO_ONLINE" | "DINHEIRO" | "CARTAO_PRESENCIAL"
  cupom: string
}

interface PedidoCriado {
  id: string
  numero: number
  total: number
  pix?: {
    qrCode: string
    qrCodeBase64: string
    expiracaoEm: string
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { itens, subtotal, alterarQuantidade, removerItem, limparCarrinho } = useCart()
  const [tela, setTela] = useState<Tela>(1)
  const [loading, setLoading] = useState(false)
  const [pedido, setPedido] = useState<PedidoCriado | null>(null)

  const [cliente, setCliente] = useState<DadosCliente>({
    nome: "", telefone: "", email: "",
    tipo: "RETIRADA", endereco: "",
  })
  const [pagamento, setPagamento] = useState<DadosPagamento>({
    forma: "PIX", cupom: "",
  })

  const taxaEntrega = cliente.tipo === "DELIVERY" ? 8 : 0
  const total = subtotal + taxaEntrega

  // ── Tela 1: Carrinho + dados ─────────────────────────────────
  if (tela === 1) return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        <Link href="/cardapio" style={backLink}>
          <ChevronLeft size={16} /> Voltar ao cardápio
        </Link>

        <StepIndicator atual={1} />

        <h1 style={tituloStyle}>Seu pedido</h1>

        {itens.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--yanni-muted)" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300, marginBottom: 24 }}>
              Carrinho vazio
            </p>
            <Link href="/cardapio" className="btn-primary">Ver cardápio</Link>
          </div>
        ) : (
          <>
            {/* Lista de itens */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 32 }}>
              {itens.map((item) => (
                <div key={item.produtoId} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 0",
                  borderBottom: "1px solid var(--yanni-border)",
                }}>
                  {item.imagemUrl && (
                    <div style={{ width: 56, height: 56, flexShrink: 0, overflow: "hidden" }}>
                      <Image src={item.imagemUrl} alt={item.nome} width={56} height={56}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 400, color: "var(--yanni-text)" }}>
                      {item.nome}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 2 }}>
                      R$ {item.preco.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <IconBtn onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}>
                      <Minus size={14} />
                    </IconBtn>
                    <span style={{ fontSize: 14, minWidth: 20, textAlign: "center", color: "var(--yanni-text)" }}>
                      {item.quantidade}
                    </span>
                    <IconBtn onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}>
                      <Plus size={14} />
                    </IconBtn>
                    <IconBtn onClick={() => removerItem(item.produtoId)} danger>
                      <Trash2 size={14} />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>

            {/* Tipo de pedido */}
            <div style={{ marginBottom: 24 }}>
              <Label>Tipo de pedido</Label>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {(["RETIRADA", "DELIVERY"] as const).map((tipo) => (
                  <button key={tipo}
                    onClick={() => setCliente(c => ({ ...c, tipo }))}
                    style={{
                      flex: 1, padding: "12px",
                      background: cliente.tipo === tipo ? "var(--yanni-red)" : "var(--yanni-surface)",
                      border: `1px solid ${cliente.tipo === tipo ? "var(--yanni-red)" : "var(--yanni-border)"}`,
                      color: "var(--yanni-text)",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                    {tipo === "RETIRADA" ? "Retirar no local" : "Delivery (+R$ 8,00)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dados do cliente */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Nome" value={cliente.nome}
                  onChange={(v) => setCliente(c => ({ ...c, nome: v }))} placeholder="Seu nome" />
                <Field label="Telefone / WhatsApp" value={cliente.telefone}
                  onChange={(v) => setCliente(c => ({ ...c, telefone: v }))} placeholder="(00) 00000-0000" />
              </div>
              <Field label="E-mail (opcional)" value={cliente.email}
                onChange={(v) => setCliente(c => ({ ...c, email: v }))} placeholder="seu@email.com" type="email" />
              {cliente.tipo === "DELIVERY" && (
                <Field label="Endereço de entrega" value={cliente.endereco}
                  onChange={(v) => setCliente(c => ({ ...c, endereco: v }))}
                  placeholder="Rua, número, bairro" />
              )}
            </div>

            {/* Resumo + botão */}
            <div style={{
              background: "var(--yanni-surface)",
              border: "1px solid var(--yanni-border)",
              padding: "20px",
              marginBottom: 24,
            }}>
              <ResumoLinha label="Subtotal" valor={subtotal} />
              {taxaEntrega > 0 && <ResumoLinha label="Taxa de entrega" valor={taxaEntrega} />}
              <div style={{ height: 1, background: "var(--yanni-border)", margin: "12px 0" }} />
              <ResumoLinha label="Total" valor={total} bold />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                if (!cliente.nome) { toast.error("Informe seu nome"); return }
                if (!cliente.telefone) { toast.error("Informe seu telefone"); return }
                if (cliente.tipo === "DELIVERY" && !cliente.endereco) {
                  toast.error("Informe o endereço de entrega"); return
                }
                setTela(2)
              }}
            >
              Continuar para pagamento
            </button>
          </>
        )}
      </div>
    </div>
  )

  // ── Tela 2: Pagamento ────────────────────────────────────────
  if (tela === 2) return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button onClick={() => setTela(1)} style={backLink}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <StepIndicator atual={2} />
        <h1 style={tituloStyle}>Pagamento</h1>

        {/* Opções de pagamento */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {[
            { forma: "PIX", label: "Pix", desc: "Aprovação instantânea" },
            { forma: "CARTAO_ONLINE", label: "Cartão online", desc: "Crédito/débito (InfinitPay)" },
            { forma: "DINHEIRO", label: "Dinheiro na entrega", desc: "Pague ao receber" },
            { forma: "CARTAO_PRESENCIAL", label: "Cartão na entrega", desc: "Máquina na entrega/balcão" },
          ].map(({ forma, label, desc }) => (
            <button key={forma}
              onClick={() => setPagamento(p => ({ ...p, forma: forma as any }))}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px",
                background: pagamento.forma === forma ? "rgba(200,16,46,0.08)" : "var(--yanni-surface)",
                border: `1px solid ${pagamento.forma === forma ? "var(--yanni-red)" : "var(--yanni-border)"}`,
                cursor: "pointer", transition: "all 0.2s", textAlign: "left",
              }}>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--yanni-text)", fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginTop: 2 }}>{desc}</p>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: `2px solid ${pagamento.forma === forma ? "var(--yanni-red)" : "rgba(255,255,255,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pagamento.forma === forma && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yanni-red)" }} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Cupom */}
        <div style={{ marginBottom: 32 }}>
          <Label>Cupom de desconto (opcional)</Label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={pagamento.cupom}
              onChange={(e) => setPagamento(p => ({ ...p, cupom: e.target.value.toUpperCase() }))}
              placeholder="CÓDIGO DO CUPOM"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Resumo */}
        <div style={{
          background: "var(--yanni-surface)",
          border: "1px solid var(--yanni-border)",
          padding: "20px", marginBottom: 24,
        }}>
          <ResumoLinha label="Subtotal" valor={subtotal} />
          {taxaEntrega > 0 && <ResumoLinha label="Taxa de entrega" valor={taxaEntrega} />}
          <div style={{ height: 1, background: "var(--yanni-border)", margin: "12px 0" }} />
          <ResumoLinha label="Total" valor={total} bold />
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            try {
              const res = await fetch("/api/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  unidadeId: process.env.NEXT_PUBLIC_UNIDADE_SLUG,
                  tipo: cliente.tipo,
                  clienteNome: cliente.nome,
                  clienteTelefone: cliente.telefone,
                  clienteEmail: cliente.email || undefined,
                  enderecoEntrega: cliente.endereco || undefined,
                  formaPagamento: pagamento.forma,
                  cupomCodigo: pagamento.cupom || undefined,
                  itens: itens.map(i => ({
                    produtoId: i.produtoId,
                    quantidade: i.quantidade,
                    observacao: i.observacao,
                  })),
                }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.erro ?? "Erro ao criar pedido")
              setPedido({ id: data.pedido.id, numero: data.pedido.numero, total: data.pedido.total, pix: data.pix })
              limparCarrinho()
              setTela(3)
            } catch (e: any) {
              toast.error(e.message)
            } finally {
              setLoading(false)
            }
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Processando..." : `Confirmar pedido · R$ ${total.toFixed(2).replace(".", ",")}`}
        </button>
      </div>
    </div>
  )

  // ── Tela 3: Confirmação / Pix ────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, textAlign: "center" }}>
        <StepIndicator atual={3} />

        {pedido?.pix ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--yanni-red)", marginBottom: 12 }}>
                Pedido #{pedido.numero}
              </p>
              <h1 style={tituloStyle}>Pague com Pix</h1>
              <p style={{ color: "var(--yanni-muted)", fontSize: 14, marginTop: 8 }}>
                QR Code válido por 30 minutos
              </p>
            </div>

            {/* QR Code */}
            <div style={{
              background: "#fff",
              padding: 24,
              display: "inline-block",
              margin: "0 auto 24px",
            }}>
              <img
                src={`data:image/png;base64,${pedido.pix.qrCodeBase64}`}
                alt="QR Code Pix"
                width={200} height={200}
              />
            </div>

            {/* Copia e cola */}
            <div style={{
              background: "var(--yanni-surface)",
              border: "1px solid var(--yanni-border)",
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <code style={{
                flex: 1, fontSize: 11,
                color: "var(--yanni-muted)",
                wordBreak: "break-all",
                textAlign: "left",
                fontFamily: "monospace",
              }}>
                {pedido.pix.qrCode.slice(0, 60)}...
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pedido!.pix!.qrCode)
                  toast.success("Código copiado!")
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--yanni-red)" }}
              >
                <Copy size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginBottom: 32 }}>
              Após o pagamento, seu pedido será enviado automaticamente para a cozinha.
            </p>
          </>
        ) : (
          <>
            <CheckCircle size={56} color="var(--yanni-red)" style={{ margin: "0 auto 24px" }} />
            <p style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--yanni-muted)", marginBottom: 12 }}>
              Pedido #{pedido?.numero}
            </p>
            <h1 style={tituloStyle}>Pedido confirmado!</h1>
            <p style={{ color: "var(--yanni-muted)", fontSize: 14, marginTop: 12, marginBottom: 40, lineHeight: 1.7 }}>
              Pague no momento da {cliente.tipo === "DELIVERY" ? "entrega" : "retirada"}.<br />
              Seu pedido já está sendo preparado.
            </p>
          </>
        )}

        <Link href={`/pedido?id=${pedido?.id}`} className="btn-ghost" style={{ marginRight: 12 }}>
          Acompanhar pedido
        </Link>
        <Link href="/cardapio" className="btn-primary">
          Fazer novo pedido
        </Link>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function StepIndicator({ atual }: { atual: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      marginBottom: 40,
    }}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: s <= atual ? "var(--yanni-red)" : "var(--yanni-surface)",
            border: `1px solid ${s <= atual ? "var(--yanni-red)" : "var(--yanni-border)"}`,
            fontSize: 12, fontWeight: 500,
            color: s <= atual ? "#fff" : "var(--yanni-muted)",
            transition: "all 0.3s",
          }}>{s}</div>
          {s < 3 && (
            <div style={{
              width: 40, height: 1,
              background: s < atual ? "var(--yanni-red)" : "var(--yanni-border)",
              transition: "background 0.3s",
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: "var(--yanni-muted)",
      display: "block",
    }}>{children}</label>
  )
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, marginTop: 6 }}
      />
    </div>
  )
}

function ResumoLinha({ label, valor, bold }: { label: string; valor: number; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: bold ? "var(--yanni-text)" : "var(--yanni-muted)", fontWeight: bold ? 500 : 300 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--yanni-text)", fontWeight: bold ? 500 : 300 }}>
        R$ {valor.toFixed(2).replace(".", ",")}
      </span>
    </div>
  )
}

function IconBtn({ onClick, children, danger }: {
  onClick: () => void; children: React.ReactNode; danger?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28,
      background: "transparent",
      border: `1px solid ${danger ? "rgba(200,16,46,0.3)" : "var(--yanni-border)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
      color: danger ? "var(--yanni-red)" : "var(--yanni-muted)",
      transition: "all 0.2s",
    }}>{children}</button>
  )
}

// ── Estilos compartilhados ────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--yanni-black)",
  paddingTop: 80,
  paddingBottom: 80,
}

const containerStyle: React.CSSProperties = {
  maxWidth: 560,
  margin: "0 auto",
  padding: "0 24px",
}

const tituloStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(28px, 5vw, 40px)",
  fontWeight: 300,
  color: "var(--yanni-text)",
  marginBottom: 32,
}

const backLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--yanni-muted)",
  textDecoration: "none",
  marginBottom: 40,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--yanni-surface)",
  border: "1px solid var(--yanni-border)",
  padding: "12px 16px",
  color: "var(--yanni-text)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
}
