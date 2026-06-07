"use client"

import Image from "next/image"
import { Plus, Star, ChefHat, Flame } from "lucide-react"
import { useState } from "react"
import { ProdutoModal } from "./ProdutoModal"

interface ProdutoCardProps {
  id: string
  nome: string
  descricao?: string
  preco: number
  imagemUrl?: string
  especial?: boolean
  especialQtd?: number
  especialVendidos?: number
  sugestaoChef?: boolean
  destaque?: boolean
  delay?: number
}

export function ProdutoCard({
  id, nome, descricao, preco, imagemUrl,
  especial, especialQtd, especialVendidos,
  sugestaoChef, destaque, delay = 0,
}: ProdutoCardProps) {
  const [modalAberto, setModalAberto] = useState(false)

  const restantes = especial && especialQtd
    ? Math.max(0, especialQtd - (especialVendidos ?? 0))
    : null

  return (
    <>
      <div
        className="produto-card"
        style={{
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: `fadeUp 0.6s ease ${delay}ms both`,
          cursor: "pointer",
        }}
        onClick={() => setModalAberto(true)}
      >
        <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
          {imagemUrl ? (
            <Image src={imagemUrl} alt={nome} fill style={{ objectFit: "cover", transition: "transform 0.5s ease" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--yanni-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "rgba(255,255,255,0.08)" }}>魚</span>
            </div>
          )}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {especial && (
              <span className="badge-especial" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Flame size={10} />
                {restantes !== null && restantes <= 5 ? `Últimas ${restantes}` : "Especial do dia"}
              </span>
            )}
            {sugestaoChef && (
              <span className="badge-chef" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ChefHat size={10} /> Chef recomenda
              </span>
            )}
          </div>
          {destaque && (
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <Star size={16} fill="var(--yanni-gold)" color="var(--yanni-gold)" />
            </div>
          )}
        </div>

        <div style={{ padding: "16px 16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 400, color: "var(--yanni-text)", letterSpacing: ".02em" }}>
            {nome}
          </h3>
          {descricao && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 300, color: "var(--yanni-muted)", lineHeight: 1.6, flex: 1 }}>
              {descricao}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 500, color: "var(--yanni-text)" }}>
              R$ {preco.toFixed(2).replace(".", ",")}
            </span>
            <div
              onClick={(e) => { e.stopPropagation(); setModalAberto(true) }}
              style={{ width: 36, height: 36, background: "var(--yanni-red)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
              role="button" aria-label={`Adicionar ${nome}`}
            >
              <Plus size={18} color="#fff" />
            </div>
          </div>
        </div>
      </div>

      <ProdutoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        produto={{ id, nome, descricao, preco, imagemUrl, especial, especialQtd, especialVendidos, sugestaoChef }}
      />
    </>
  )
}
