"use client"

import { createContext, useContext } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
  imagemUrl?: string
  observacao?: string
}

interface CartStore {
  itens: CartItem[]
  adicionarItem: (item: Omit<CartItem, "quantidade">) => void
  removerItem: (produtoId: string) => void
  alterarQuantidade: (produtoId: string, quantidade: number) => void
  atualizarObservacao: (produtoId: string, obs: string) => void
  limparCarrinho: () => void
  totalItens: number
  subtotal: number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      itens: [],
      totalItens: 0,
      subtotal: 0,

      adicionarItem: (item) => {
        const { itens } = get()
        const existente = itens.find((i) => i.produtoId === item.produtoId)
        let novos: CartItem[]
        if (existente) {
          novos = itens.map((i) =>
            i.produtoId === item.produtoId
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          )
        } else {
          novos = [...itens, { ...item, quantidade: 1 }]
        }
        set({
          itens: novos,
          totalItens: novos.reduce((a, i) => a + i.quantidade, 0),
          subtotal: novos.reduce((a, i) => a + i.preco * i.quantidade, 0),
        })
      },

      removerItem: (produtoId) => {
        const novos = get().itens.filter((i) => i.produtoId !== produtoId)
        set({
          itens: novos,
          totalItens: novos.reduce((a, i) => a + i.quantidade, 0),
          subtotal: novos.reduce((a, i) => a + i.preco * i.quantidade, 0),
        })
      },

      alterarQuantidade: (produtoId, quantidade) => {
        if (quantidade < 1) { get().removerItem(produtoId); return }
        const novos = get().itens.map((i) =>
          i.produtoId === produtoId ? { ...i, quantidade } : i
        )
        set({
          itens: novos,
          totalItens: novos.reduce((a, i) => a + i.quantidade, 0),
          subtotal: novos.reduce((a, i) => a + i.preco * i.quantidade, 0),
        })
      },

      atualizarObservacao: (produtoId, observacao) => {
        set({
          itens: get().itens.map((i) =>
            i.produtoId === produtoId ? { ...i, observacao } : i
          ),
        })
      },

      limparCarrinho: () => set({ itens: [], totalItens: 0, subtotal: 0 }),
    }),
    { name: "yanni-cart" }
  )
)

// Context apenas para conveniência de uso no JSX
const CartContext = createContext<CartStore | null>(null)
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <CartContext.Provider value={useCartStore()}>{children}</CartContext.Provider>
}
export function useCart() {
  return useCartStore()
}
