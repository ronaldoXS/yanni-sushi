# Yanni Sushi — Documentação Técnica

## Stack

| Camada       | Tecnologia               | Justificativa                          |
|--------------|--------------------------|----------------------------------------|
| Frontend     | Next.js 14 (App Router)  | SSR, performance, API Routes integradas|
| Hospedagem   | Vercel (plano gratuito)  | Deploy automático, CDN global          |
| Banco        | PostgreSQL via Neon.tech  | Serverless, camada gratuita generosa   |
| ORM          | Prisma                   | Type-safe, migrations automáticas      |
| UI           | Shadcn UI + Tailwind     | Componentes acessíveis, customizáveis  |
| Pagamento    | Mercado Pago + InfinitPay| Pix Dinâmico + Cartão Online           |
| Upload       | UploadThing              | Imagens sem custo inicial              |
| Auth         | NextAuth.js              | Sessões seguras, multi-role            |

---

## Estrutura de Pastas

```
yanni-sushi/
├── prisma/
│   ├── schema.prisma        # Modelo de dados completo
│   └── seed.ts              # Dados iniciais
├── src/
│   ├── app/
│   │   ├── (site)/          # Rotas públicas do cliente
│   │   │   ├── cardapio/
│   │   │   ├── checkout/
│   │   │   └── pedido/
│   │   ├── (admin)/         # Painel administrativo (protegido)
│   │   │   ├── dashboard/
│   │   │   ├── cardapio/
│   │   │   ├── pedidos/
│   │   │   ├── financeiro/
│   │   │   └── relatorios/
│   │   └── api/
│   │       ├── pedidos/     # CRUD de pedidos
│   │       ├── produtos/    # CRUD com auditoria
│   │       ├── webhooks/    # Mercado Pago / InfinitPay
│   │       ├── estoque/     # Movimentos
│   │       └── relatorios/  # Rankings e resumos
│   ├── components/
│   │   ├── ui/              # Shadcn components
│   │   ├── site/            # Componentes do cardápio público
│   │   ├── admin/           # Componentes do painel
│   │   └── shared/          # Compartilhados
│   └── lib/
│       ├── db/              # Prisma client
│       ├── payments/        # Mercado Pago, InfinitPay
│       ├── printing/        # Impressão térmica
│       ├── auth/            # NextAuth config
│       └── utils/           # Pedido, estoque, fidelidade
```

---

## Regra de Ouro — Fluxo de Pagamento

```
Cliente → Checkout → POST /api/pedidos
         ↓
    Pedido criado (status: AGUARDANDO_PAGAMENTO)
         ↓
    [PIX] QR Code gerado via Mercado Pago
         ↓
    Cliente paga → Webhook /api/webhooks/mercadopago
         ↓
    Validação de assinatura (HMAC-SHA256)
         ↓
    Pedido atualizado (status: PAGO / EM_PREPARO)
         ↓
    processarPedidoAprovado():
      1. Baixa de estoque automática
      2. Crédito de pontos de fidelidade
      3. Envio para impressora (Cozinha / Bar)
```

**Pagamento presencial** (dinheiro/cartão na entrega):
- Status inicial: `EM_PREPARO` (vai direto para produção)
- Status pagamento: `PENDENTE` (confirmado pelo operador)

---

## Auditoria

Toda alteração de preço, disponibilidade ou nome de produto gera um registro em `logs_alteracao` com:
- Usuário responsável
- Campo alterado
- Valor anterior e novo
- IP de origem
- Timestamp

---

## Multi-tenant

A arquitetura suporta múltiplas unidades. Cada unidade tem:
- Configuração própria (logo, cores, taxa de entrega, pontos)
- Cardápio próprio
- Pedidos isolados
- Usuários segregados por role

Para adicionar uma nova unidade: criar registro em `Unidade` e `ConfiguracaoUnidade`.

---

## Backup

- Cron diário às 03:00 (Horário de Brasília)
- Gerado via `pg_dump` para arquivo `.sql`
- Retenção automática dos últimos 30 backups
- **Recomendado em produção**: configurar também backup nativo do Neon.tech (Point-in-Time Recovery)

---

## Integrações Futuras via n8n

A API está preparada para automações via webhooks. Exemplos possíveis:
- Notificação no WhatsApp ao cliente quando pedido sair para entrega
- Resumo noturno automático via `GET /api/relatorios?tipo=resumo_noturno`
- Alerta de estoque baixo
- Sincronização com planilha financeira

---

## Primeiros Passos

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# → Preencher DATABASE_URL (Neon.tech), NEXTAUTH_SECRET, etc.

# 3. Aplicar schema no banco
npm run db:push

# 4. Popular dados iniciais
npm run db:seed

# 5. Rodar em desenvolvimento
npm run dev
```
