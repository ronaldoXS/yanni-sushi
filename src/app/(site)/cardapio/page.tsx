import { prisma } from "@/lib/db/prisma"
import { ProdutoCard } from "@/components/site/ProdutoCard"
import { ChefHat, Flame, Search } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cardápio — Yanni Sushi",
  description: "Sushi artesanal. Especiais do dia e sugestões do chef.",
}

export const revalidate = 60 // ISR: revalida a cada 60s

async function getProdutos(unidadeSlug: string) {
  const unidade = await prisma.unidade.findUnique({
    where: { slug: unidadeSlug },
    select: { id: true },
  })
  if (!unidade) return { especiais: [], sugestoes: [], categorias: [] }

  const produtos = await prisma.produto.findMany({
    where: { unidadeId: unidade.id, disponivel: true },
    include: { categoria: true },
    orderBy: [{ categoria: { ordem: "asc" } }, { nome: "asc" }],
  })

  const especiais = produtos.filter((p) => p.especial)
  const sugestoes = produtos.filter((p) => p.sugestaoChef)

  const categorias = Object.values(
    produtos.reduce((acc, p) => {
      if (!acc[p.categoriaId]) {
        acc[p.categoriaId] = { categoria: p.categoria, produtos: [] }
      }
      acc[p.categoriaId].produtos.push(p)
      return acc
    }, {} as Record<string, { categoria: typeof produtos[0]["categoria"]; produtos: typeof produtos }>)
  )

  return { especiais, sugestoes, categorias }
}

export default async function CardapioPage() {
  const slug = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"
  const { especiais, sugestoes, categorias } = await getProdutos(slug)

  return (
    <div style={{ paddingTop: 64, minHeight: "100vh", background: "var(--yanni-black)" }}>

      {/* Header da página */}
      <div style={{
        padding: "72px 24px 48px",
        maxWidth: 1100,
        margin: "0 auto",
        borderBottom: "1px solid var(--yanni-border)",
      }}>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--yanni-red)",
          marginBottom: 12,
        }}>Nosso cardápio</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 300,
          color: "var(--yanni-text)",
          letterSpacing: "-.01em",
        }}>O que preparamos <br />para você hoje</h1>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* ── Especial do Dia ──────────────────────────────────── */}
        {especiais.length > 0 && (
          <section style={{ paddingTop: 64, paddingBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <Flame size={18} color="var(--yanni-red)" />
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--yanni-text)",
                letterSpacing: ".05em",
              }}>Especial do dia</h2>
              <div style={{ flex: 1, height: 1, background: "var(--yanni-border)", marginLeft: 8 }} />
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}>
              {especiais.map((p, i) => (
                <ProdutoCard
                  key={p.id}
                  id={p.id}
                  nome={p.nome}
                  descricao={p.descricao ?? undefined}
                  preco={Number(p.preco)}
                  imagemUrl={p.imagemUrl ?? undefined}
                  especial
                  especialQtd={p.especialQtd ?? undefined}
                  especialVendidos={p.especialVendidos}
                  delay={i * 60}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Sugestão do Chef ─────────────────────────────────── */}
        {sugestoes.length > 0 && (
          <section style={{ paddingBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <ChefHat size={18} color="var(--yanni-gold)" />
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--yanni-text)",
                letterSpacing: ".05em",
              }}>Sugestão do chef</h2>
              <div style={{ flex: 1, height: 1, background: "var(--yanni-border)", marginLeft: 8 }} />
            </div>

            {/* Layout destaque horizontal para sugestões */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}>
              {sugestoes.map((p, i) => (
                <ProdutoCard
                  key={p.id}
                  id={p.id}
                  nome={p.nome}
                  descricao={p.descricao ?? undefined}
                  preco={Number(p.preco)}
                  imagemUrl={p.imagemUrl ?? undefined}
                  sugestaoChef
                  delay={i * 60}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Divisor ──────────────────────────────────────────── */}
        {(especiais.length > 0 || sugestoes.length > 0) && categorias.length > 0 && (
          <div className="divider-red" style={{ marginBottom: 64 }} />
        )}

        {/* ── Categorias ───────────────────────────────────────── */}
        {categorias.map(({ categoria, produtos }) => (
          <section
            key={categoria.id}
            id={`cat-${categoria.id}`}
            style={{ paddingBottom: 64 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
              {categoria.icone && (
                <span style={{ fontSize: 20 }}>{categoria.icone}</span>
              )}
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 300,
                color: "var(--yanni-text)",
                letterSpacing: ".05em",
              }}>{categoria.nome}</h2>
              <div style={{ flex: 1, height: 1, background: "var(--yanni-border)", marginLeft: 8 }} />
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--yanni-muted)",
              }}>{produtos.length} itens</span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}>
              {produtos.map((p, i) => (
                <ProdutoCard
                  key={p.id}
                  id={p.id}
                  nome={p.nome}
                  descricao={p.descricao ?? undefined}
                  preco={Number(p.preco)}
                  imagemUrl={p.imagemUrl ?? undefined}
                  destaque={p.destaque}
                  delay={i * 40}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Estado vazio */}
        {categorias.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "120px 0",
            color: "var(--yanni-muted)",
          }}>
            <Search size={40} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} />
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300 }}>
              Cardápio sendo preparado
            </p>
          </div>
        )}

        {/* Espaço final */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  )
}
