"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Minus, ChefHat, Flame, X, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCart } from "./CartProvider"
import { toast } from "sonner"

interface ProdutoModalProps {
  aberto: boolean
  onFechar: () => void
  produto: {
    id: string
    nome: string
    descricao?: string
    preco: number
    imagemUrl?: string
    especial?: boolean
    especialQtd?: number
    especialVendidos?: number
    sugestaoChef?: boolean
  }
}

export function ProdutoModal({ aberto, onFechar, produto }: ProdutoModalProps) {
  const { adicionarItem } = useCart()
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState("")

  const restantes = produto.especial && produto.especialQtd
    ? Math.max(0, produto.especialQtd - (produto.especialVendidos ?? 0))
    : null

  function handleAdicionar() {
    for (let i = 0; i < quantidade; i++) {
      adicionarItem({
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        imagemUrl: produto.imagemUrl,
        observacao: observacao.trim() || undefined,
      })
    }
    toast.success(`${quantidade}× ${produto.nome} adicionado`, {
      description: observacao ? `Obs: ${observacao}` : undefined,
    })
    setQuantidade(1)
    setObservacao("")
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent style={{ maxWidth: 480, padding: 0, overflow: "hidden" }}>

        {/* Imagem */}
        <div style={{ position: "relative", aspectRatio: "16/9", width: "100%", background: "#1A1A1A" }}>
          {produto.imagemUrl ? (
            <Image src={produto.imagemUrl} alt={produto.nome} fill style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 48, opacity: 0.1 }}>魚</span>
            </div>
          )}

          {/* Badges sobre a imagem */}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {produto.especial && (
              <span className="badge-especial" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Flame size={10} />
                {restantes !== null && restantes <= 5 ? `Últimas ${restantes} unidades` : "Especial do dia"}
              </span>
            )}
            {produto.sugestaoChef && (
              <span className="badge-chef" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ChefHat size={10} /> Chef recomenda
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: "24px 28px 28px" }}>
          <DialogHeader style={{ marginBottom: 16 }}>
            <DialogTitle style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--yanni-text)" }}>
              {produto.nome}
            </DialogTitle>
            {produto.descricao && (
              <p style={{ fontSize: 13, color: "var(--yanni-muted)", lineHeight: 1.6, marginTop: 6 }}>
                {produto.descricao}
              </p>
            )}
          </DialogHeader>

          {/* ── Dica do Chef — campo de observação ───────────── */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 500, letterSpacing: ".1em",
              textTransform: "uppercase", color: "var(--yanni-muted)",
              marginBottom: 8,
            }}>
              <MessageSquare size={12} />
              Alguma observação? (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: sem wasabi, molho à parte, sem pepino..."
              maxLength={120}
              rows={2}
              style={{
                width: "100%",
                background: "var(--yanni-surface-2)",
                border: "1px solid var(--yanni-border)",
                padding: "10px 14px",
                color: "var(--yanni-text)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            <p style={{ fontSize: 11, color: "var(--yanni-muted)", marginTop: 4, textAlign: "right" }}>
              {observacao.length}/120
            </p>
          </div>

          {/* Quantidade + preço + botão */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Seletor de quantidade */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                style={{
                  width: 32, height: 32,
                  background: "var(--yanni-surface-2)",
                  border: "1px solid var(--yanni-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--yanni-muted)",
                }}
              ><Minus size={14} /></button>

              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--yanni-text)", minWidth: 20, textAlign: "center" }}>
                {quantidade}
              </span>

              <button
                onClick={() => setQuantidade((q) => q + 1)}
                style={{
                  width: 32, height: 32,
                  background: "var(--yanni-surface-2)",
                  border: "1px solid var(--yanni-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--yanni-muted)",
                }}
              ><Plus size={14} /></button>
            </div>

            {/* Preço + adicionar */}
            <button
              onClick={handleAdicionar}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span style={{ fontSize: 13 }}>
                Adicionar · R$ {(produto.preco * quantidade).toFixed(2).replace(".", ",")}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
