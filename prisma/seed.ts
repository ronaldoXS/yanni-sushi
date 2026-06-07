import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // ── Unidade ────────────────────────────────────────────────
  const unidade = await prisma.unidade.upsert({
    where: { slug: "yanni-fortaleza" },
    update: {},
    create: {
      nome: "Yanni Sushi Fortaleza",
      slug: "yanni-fortaleza",
      telefone: "(85) 99999-9999",
      endereco: "Av. Exemplo, 1000 - Fortaleza/CE",
      ativo: true,
    },
  })
  console.log("✓ Unidade criada:", unidade.slug)

  // ── Configuração ───────────────────────────────────────────
  await prisma.configuracaoUnidade.upsert({
    where: { unidadeId: unidade.id },
    update: {},
    create: {
      unidadeId: unidade.id,
      nomeExibicao: "Yanni Sushi",
      corPrimaria: "#C8102E",
      mensagemChef: "Cada peça é preparada com respeito ao ingrediente e à tradição japonesa.",
      taxaEntrega: 8.0,
      pedidoMinimo: 30.0,
      aceitaPagPresencial: true,
      programaPontos: true,
      pontosPorReal: 1,
      pontosParaDesconto: 100,
      descontoPontos: 5.0,
    },
  })
  console.log("✓ Configuração criada")

  // ── Usuário admin ──────────────────────────────────────────
  const senhaHash = await bcrypt.hash("yanni@2025", 10)
  await prisma.usuario.upsert({
    where: { email_unidadeId: { email: "admin@yannisushi.com.br", unidadeId: unidade.id } },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@yannisushi.com.br",
      senha: senhaHash,
      role: "ADMIN",
      unidadeId: unidade.id,
    },
  })
  console.log("✓ Usuário admin: admin@yannisushi.com.br / yanni@2025")

  // ── Categorias ─────────────────────────────────────────────
  const cats = [
    { nome: "Combinados", icone: "🍱", ordem: 1 },
    { nome: "Niguiri", icone: "🍣", ordem: 2 },
    { nome: "Uramaki", icone: "🌀", ordem: 3 },
    { nome: "Temaki", icone: "🌮", ordem: 4 },
    { nome: "Sashimi", icone: "🐟", ordem: 5 },
    { nome: "Entradas", icone: "🥢", ordem: 6 },
    { nome: "Bebidas", icone: "🍵", ordem: 7 },
  ]

  const categorias: Record<string, string> = {}
  for (const cat of cats) {
    const c = await prisma.categoria.upsert({
      where: { id: `cat-${cat.ordem}` },
      update: { nome: cat.nome },
      create: { id: `cat-${cat.ordem}`, ...cat },
    })
    categorias[cat.nome] = c.id
  }
  console.log("✓ Categorias criadas:", Object.keys(categorias).join(", "))

  // ── Produtos ───────────────────────────────────────────────
  const produtos = [
    // Combinados
    { nome: "Combinado Yanni 30 peças", descricao: "Seleção do chef: nigiris, uramakis e temaki especial", preco: 89.90, precoCusto: 32.0, categoriaId: categorias["Combinados"], especial: true, especialQtd: 10, destaque: true, rotaImpressao: "COZINHA" },
    { nome: "Combinado Família 50 peças", descricao: "Perfeito para compartilhar com quem você ama", preco: 139.90, precoCusto: 52.0, categoriaId: categorias["Combinados"], rotaImpressao: "COZINHA" },
    { nome: "Combinado Executivo 20 peças", descricao: "Rápido, saboroso e equilibrado", preco: 62.90, precoCusto: 22.0, categoriaId: categorias["Combinados"], rotaImpressao: "COZINHA" },

    // Niguiri
    { nome: "Niguiri Salmão (2 un)", descricao: "Salmão fresco sobre arroz temperado", preco: 18.90, precoCusto: 7.0, categoriaId: categorias["Niguiri"], sugestaoChef: true, rotaImpressao: "COZINHA" },
    { nome: "Niguiri Atum (2 un)", descricao: "Atum selecionado sobre arroz japonês", preco: 19.90, precoCusto: 8.0, categoriaId: categorias["Niguiri"], rotaImpressao: "COZINHA" },
    { nome: "Niguiri Camarão (2 un)", descricao: "Camarão grelhado sobre arroz", preco: 17.90, precoCusto: 6.5, categoriaId: categorias["Niguiri"], rotaImpressao: "COZINHA" },

    // Uramaki
    { nome: "Philadelphia Roll (8 un)", descricao: "Salmão, cream cheese e pepino", preco: 32.90, precoCusto: 11.0, categoriaId: categorias["Uramaki"], destaque: true, rotaImpressao: "COZINHA" },
    { nome: "Hot Roll Salmão (8 un)", descricao: "Salmão empanado e frito, molho teriyaki", preco: 34.90, precoCusto: 12.0, categoriaId: categorias["Uramaki"], rotaImpressao: "COZINHA" },
    { nome: "Dragon Roll (8 un)", descricao: "Camarão, abacate e molho especial", preco: 38.90, precoCusto: 14.0, categoriaId: categorias["Uramaki"], sugestaoChef: true, rotaImpressao: "COZINHA" },

    // Temaki
    { nome: "Temaki Salmão", descricao: "Salmão, cream cheese e cebolinha", preco: 22.90, precoCusto: 8.0, categoriaId: categorias["Temaki"], rotaImpressao: "COZINHA" },
    { nome: "Temaki Camarão", descricao: "Camarão, cream cheese e alface", preco: 24.90, precoCusto: 9.0, categoriaId: categorias["Temaki"], rotaImpressao: "COZINHA" },

    // Sashimi
    { nome: "Sashimi Salmão (5 un)", descricao: "Fatias frescas de salmão importado", preco: 36.90, precoCusto: 16.0, categoriaId: categorias["Sashimi"], sugestaoChef: true, rotaImpressao: "COZINHA" },
    { nome: "Sashimi Atum (5 un)", descricao: "Fatias frescas de atum selecionado", preco: 38.90, precoCusto: 17.0, categoriaId: categorias["Sashimi"], rotaImpressao: "COZINHA" },

    // Entradas
    { nome: "Gyoza (6 un)", descricao: "Pastéis japoneses grelhados com molho ponzu", preco: 26.90, precoCusto: 9.0, categoriaId: categorias["Entradas"], rotaImpressao: "COZINHA" },
    { nome: "Edamame", descricao: "Soja cozida com sal marinho", preco: 16.90, precoCusto: 4.0, categoriaId: categorias["Entradas"], rotaImpressao: "COZINHA" },
    { nome: "Missoshiru", descricao: "Sopa de missô tradicional com tofu", preco: 12.90, precoCusto: 3.0, categoriaId: categorias["Entradas"], rotaImpressao: "COZINHA" },

    // Bebidas
    { nome: "Saquê Quente", descricao: "Saquê tradicional servido quente", preco: 18.90, precoCusto: 5.0, categoriaId: categorias["Bebidas"], rotaImpressao: "BAR" },
    { nome: "Chá Verde", descricao: "Chá verde japonês gelado ou quente", preco: 9.90, precoCusto: 2.0, categoriaId: categorias["Bebidas"], rotaImpressao: "BAR" },
    { nome: "Água Mineral 500ml", descricao: "Com ou sem gás", preco: 6.90, precoCusto: 1.5, categoriaId: categorias["Bebidas"], controlaEstoque: true, estoqueAtual: 50, estoqueMinimo: 10, rotaImpressao: "BAR" },
    { nome: "Refrigerante Lata", descricao: "Coca-Cola, Guaraná ou Água Tônica", preco: 8.90, precoCusto: 3.0, categoriaId: categorias["Bebidas"], controlaEstoque: true, estoqueAtual: 40, estoqueMinimo: 10, rotaImpressao: "BAR" },
  ]

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { id: `prod-${p.nome.slice(0, 10).replace(/\s/g, "")}` },
      update: { preco: p.preco },
      create: {
        id: `prod-${p.nome.slice(0, 10).replace(/\s/g, "")}`,
        unidadeId: unidade.id,
        disponivel: true,
        especial: false,
        especialVendidos: 0,
        sugestaoChef: false,
        destaque: false,
        ...p,
        rotaImpressao: (p.rotaImpressao ?? "COZINHA") as any,
        precoCusto: p.precoCusto ?? null,
        controlaEstoque: p.controlaEstoque ?? false,
        estoqueAtual: p.estoqueAtual ?? 0,
        estoqueMinimo: p.estoqueMinimo ?? 0,
      } as any,
    })
  }
  console.log("✓ Produtos criados:", produtos.length)

  // ── Cupons de exemplo ──────────────────────────────────────
  await prisma.cupom.upsert({
    where: { codigo_unidadeId: { codigo: "BEMVINDO10", unidadeId: unidade.id } },
    update: {},
    create: {
      unidadeId: unidade.id,
      codigo: "BEMVINDO10",
      tipo: "PERCENTUAL",
      valor: 10,
      pedidoMinimo: 50,
      usoUnico: true,
      ativo: true,
    },
  })
  await prisma.cupom.upsert({
    where: { codigo_unidadeId: { codigo: "FRETE0", unidadeId: unidade.id } },
    update: {},
    create: {
      unidadeId: unidade.id,
      codigo: "FRETE0",
      tipo: "FIXO",
      valor: 8,
      pedidoMinimo: 60,
      usoUnico: false,
      ativo: true,
    },
  })
  console.log("✓ Cupons de exemplo criados")

  console.log("\n✅ Seed concluído!")
  console.log("─────────────────────────────────────────")
  console.log("Admin: admin@yannisushi.com.br / yanni@2025")
  console.log("Unidade: yanni-fortaleza")
  console.log("─────────────────────────────────────────")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
