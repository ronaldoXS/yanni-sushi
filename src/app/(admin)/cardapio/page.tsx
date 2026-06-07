"use client"

import { useEffect, useState } from "react"
import { ToggleLeft, ToggleRight, Pencil, Plus, Upload, X, Loader2, ChefHat, Flame } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface Produto {
  id: string
  nome: string
  descricao?: string
  preco: number
  imagemUrl?: string
  disponivel: boolean
  especial: boolean
  sugestaoChef: boolean
  destaque: boolean
  rotaImpressao: "COZINHA" | "BAR" | "AMBOS"
  categoria: { nome: string }
}

export default function CardapioAdminPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const res = await fetch(`/api/produtos?unidadeId=${process.env.NEXT_PUBLIC_UNIDADE_SLUG}&admin=true`)
    const data = await res.json()
    setProdutos(data.produtos ?? [])
    setLoading(false)
  }

  async function toggleDisponivel(p: Produto) {
    const novo = !p.disponivel
    setProdutos((prev) => prev.map((x) => x.id === p.id ? { ...x, disponivel: novo } : x))
    await fetch("/api/produtos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, disponivel: novo }),
    })
    toast.success(novo ? `${p.nome} disponível` : `${p.nome} removido do site`)
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    try {
      const res = await fetch("/api/produtos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando.id,
          nome: editando.nome,
          descricao: editando.descricao,
          preco: Number(editando.preco),
          especial: editando.especial,
          sugestaoChef: editando.sugestaoChef,
          destaque: editando.destaque,
          rotaImpressao: editando.rotaImpressao,
        }),
      })
      if (!res.ok) throw new Error()
      await carregar()
      setEditando(null)
      toast.success("Produto atualizado")
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={24} color="var(--yanni-red)" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--yanni-text)" }}>
            Cardápio
          </h1>
          <p style={{ fontSize: 13, color: "var(--yanni-muted)", marginTop: 4 }}>
            {produtos.length} produtos · {produtos.filter((p) => p.disponivel).length} disponíveis
          </p>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Tabela */}
      <div style={{
        background: "var(--yanni-surface)",
        border: "1px solid var(--yanni-border)",
        overflow: "hidden",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr 120px 100px 100px 80px 80px",
          gap: 16, padding: "12px 20px",
          borderBottom: "1px solid var(--yanni-border)",
          fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
          textTransform: "uppercase", color: "var(--yanni-muted)",
        }}>
          <span>Foto</span>
          <span>Produto</span>
          <span>Categoria</span>
          <span>Preço</span>
          <span>Impressão</span>
          <span>Selos</span>
          <span>Status</span>
        </div>

        {/* Linhas */}
        {produtos.map((p) => (
          <div key={p.id} style={{
            display: "grid",
            gridTemplateColumns: "56px 1fr 120px 100px 100px 80px 80px",
            gap: 16, padding: "14px 20px",
            borderBottom: "1px solid var(--yanni-border)",
            alignItems: "center",
            opacity: p.disponivel ? 1 : 0.5,
            transition: "opacity 0.2s",
          }}>
            {/* Imagem */}
            <div style={{ width: 44, height: 44, overflow: "hidden", flexShrink: 0 }}>
              {p.imagemUrl
                ? <Image src={p.imagemUrl} alt={p.nome} width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                : <div style={{ width: "100%", height: "100%", background: "var(--yanni-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18, opacity: 0.2 }}>魚</span>
                  </div>
              }
            </div>

            {/* Nome */}
            <div>
              <p style={{ fontSize: 13, color: "var(--yanni-text)", fontWeight: 500 }}>{p.nome}</p>
              {p.descricao && <p style={{ fontSize: 11, color: "var(--yanni-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{p.descricao}</p>}
            </div>

            {/* Categoria */}
            <span style={{ fontSize: 12, color: "var(--yanni-muted)" }}>{p.categoria.nome}</span>

            {/* Preço */}
            <span style={{ fontSize: 13, color: "var(--yanni-text)", fontWeight: 500 }}>
              R$ {Number(p.preco).toFixed(2).replace(".", ",")}
            </span>

            {/* Rota de impressão */}
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: ".08em",
              color: p.rotaImpressao === "COZINHA" ? "var(--yanni-gold)" : p.rotaImpressao === "BAR" ? "#2196F3" : "var(--yanni-red)",
              border: `1px solid currentColor`,
              padding: "2px 8px",
              display: "inline-block",
            }}>{p.rotaImpressao}</span>

            {/* Selos */}
            <div style={{ display: "flex", gap: 4 }}>
              {p.especial && <Flame size={14} color="var(--yanni-red)" title="Especial do dia" />}
              {p.sugestaoChef && <ChefHat size={14} color="var(--yanni-gold)" title="Sugestão do chef" />}
            </div>

            {/* Toggle disponível + editar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => toggleDisponivel(p)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                title={p.disponivel ? "Clique para ocultar" : "Clique para exibir"}
              >
                {p.disponivel
                  ? <ToggleRight size={24} color="var(--yanni-red)" />
                  : <ToggleLeft size={24} color="var(--yanni-muted)" />
                }
              </button>
              <button
                onClick={() => setEditando(p)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--yanni-muted)" }}
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 24,
        }}>
          <div style={{
            background: "var(--yanni-surface)",
            border: "1px solid var(--yanni-border)",
            width: "100%", maxWidth: 520,
            padding: 32, maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--yanni-text)" }}>
                Editar produto
              </h2>
              <button onClick={() => setEditando(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--yanni-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminField label="Nome" value={editando.nome}
                onChange={(v) => setEditando((e) => e && ({ ...e, nome: v }))} />
              <AdminField label="Descrição" value={editando.descricao ?? ""}
                onChange={(v) => setEditando((e) => e && ({ ...e, descricao: v }))} multiline />
              <AdminField label="Preço (R$)" value={String(editando.preco)} type="number"
                onChange={(v) => setEditando((e) => e && ({ ...e, preco: Number(v) }))} />

              <div>
                <label style={labelStyle}>Rota de impressão</label>
                <select
                  value={editando.rotaImpressao}
                  onChange={(e) => setEditando((p) => p && ({ ...p, rotaImpressao: e.target.value as any }))}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  {["COZINHA", "BAR", "AMBOS"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "especial", label: "Especial do dia" },
                  { key: "sugestaoChef", label: "Sugestão do chef" },
                  { key: "destaque", label: "Destaque" },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox"
                      checked={(editando as any)[key]}
                      onChange={(e) => setEditando((p) => p && ({ ...p, [key]: e.target.checked }))}
                    />
                    <span style={{ fontSize: 13, color: "var(--yanni-text)" }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Upload imagem */}
              <div style={{
                border: "1px dashed var(--yanni-border)",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                color: "var(--yanni-muted)",
              }}>
                <Upload size={20} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 12 }}>Clique ou arraste a imagem do produto</p>
                <p style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>JPG, PNG, WebP até 4MB</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setEditando(null)} className="btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Cancelar
              </button>
              <button onClick={salvarEdicao} className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={salvando}>
                {salvando ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminField({ label, value, onChange, type = "text", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; multiline?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)}
            rows={3} style={{ ...inputStyle, marginTop: 6, resize: "vertical" }} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, marginTop: 6 }} />
      }
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
  padding: "10px 14px",
  color: "var(--yanni-text)", fontFamily: "var(--font-body)", fontSize: 13,
  outline: "none",
}
