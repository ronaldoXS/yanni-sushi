"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  BarChart3, Package, Wallet, Tag, Settings, LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

const NAV = [
  { href: "/admin/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/cardapio",      icon: UtensilsCrossed, label: "Cardápio" },
  { href: "/admin/pedidos",       icon: ShoppingBag,     label: "Pedidos" },
  { href: "/admin/estoque",       icon: Package,         label: "Estoque" },
  { href: "/admin/financeiro",    icon: Wallet,          label: "Financeiro" },
  { href: "/admin/relatorios",    icon: BarChart3,       label: "Relatórios" },
  { href: "/admin/fidelidade",    icon: Tag,             label: "Fidelidade" },
  { href: "/admin/configuracoes", icon: Settings,        label: "Configurações" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      width: 240,
      background: "var(--yanni-surface)",
      borderRight: "1px solid var(--yanni-border)",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: "28px 24px 24px",
        borderBottom: "1px solid var(--yanni-border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 30, height: 30,
          background: "var(--yanni-red)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "var(--font-display)", color: "#fff", fontSize: 13, fontWeight: 600 }}>Y</span>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 300, letterSpacing: ".1em", color: "var(--yanni-text)" }}>
            YANNI SUSHI
          </p>
          <p style={{ fontSize: 10, color: "var(--yanni-muted)", letterSpacing: ".05em" }}>Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const ativo = pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px",
              borderRadius: 6,
              background: ativo ? "rgba(200,16,46,0.12)" : "transparent",
              color: ativo ? "var(--yanni-red)" : "var(--yanni-muted)",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: ativo ? 500 : 400,
              fontFamily: "var(--font-body)",
              transition: "all 0.15s",
              borderLeft: ativo ? "2px solid var(--yanni-red)" : "2px solid transparent",
            }}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--yanni-border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", width: "100%",
            background: "none", border: "none",
            color: "var(--yanni-muted)", fontSize: 13,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
