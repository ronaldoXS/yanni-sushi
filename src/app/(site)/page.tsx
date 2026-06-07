import { HeroSection } from "@/components/site/HeroSection"
import { ProdutoCard } from "@/components/site/ProdutoCard"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const revalidate = 60

async function getDestaques(slug: string) {
  const unidade = await prisma.unidade.findUnique({
    where: { slug },
    include: { configuracao: true },
  })
  if (!unidade) return { produtos: [], config: null }

  const produtos = await prisma.produto.findMany({
    where: {
      unidadeId: unidade.id,
      disponivel: true,
      OR: [{ especial: true }, { sugestaoChef: true }, { destaque: true }],
    },
    take: 4,
    orderBy: [{ especial: "desc" }, { sugestaoChef: "desc" }],
  })

  return { produtos, config: unidade.configuracao }
}

export default async function HomePage() {
  const slug = process.env.NEXT_PUBLIC_UNIDADE_SLUG ?? "yanni-fortaleza"
  const { produtos, config } = await getDestaques(slug)

  return (
    <>
      <HeroSection />

      {/* Seção de destaques */}
      {produtos.length > 0 && (
        <section style={{
          background: "var(--yanni-black)",
          padding: "100px 24px",
          maxWidth: 1100,
          margin: "0 auto",
        }}>
          {/* Título */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 48,
            flexWrap: "wrap",
            gap: 16,
          }}>
            <div>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "var(--yanni-red)",
                marginBottom: 10,
              }}>Hoje no Yanni</p>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 300,
                color: "var(--yanni-text)",
              }}>Escolhas do dia</h2>
            </div>
            <Link
              href="/cardapio"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--yanni-muted)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--yanni-text)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--yanni-muted)")}
            >
              Ver cardápio completo <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
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
                especial={p.especial}
                sugestaoChef={p.sugestaoChef}
                destaque={p.destaque}
                delay={i * 80}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mensagem do chef */}
      {config?.mensagemChef && (
        <section style={{
          borderTop: "1px solid var(--yanni-border)",
          borderBottom: "1px solid var(--yanni-border)",
          padding: "80px 24px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(18px, 3vw, 28px)",
            fontWeight: 300,
            color: "var(--yanni-text)",
            maxWidth: 640,
            margin: "0 auto",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}>
            "{config.mensagemChef}"
          </p>
          <div style={{
            width: 40, height: 1,
            background: "var(--yanni-red)",
            margin: "28px auto 0",
          }} />
        </section>
      )}

      {/* Rodapé simples */}
      <footer style={{
        padding: "48px 24px",
        textAlign: "center",
        borderTop: "1px solid var(--yanni-border)",
      }}>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "var(--yanni-muted)",
          letterSpacing: ".05em",
        }}>
          © {new Date().getFullYear()} Yanni Sushi — Todos os direitos reservados
        </p>
      </footer>
    </>
  )
}
