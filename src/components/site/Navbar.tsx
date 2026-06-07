"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useCart } from "./CartProvider"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalItens } = useCart()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(8,8,8,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "background 0.3s, border 0.3s",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "var(--yanni-red)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "var(--font-display)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-.02em",
            }}>Y</span>
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            color: "var(--yanni-text)",
            fontSize: 16,
            fontWeight: 300,
            letterSpacing: ".15em",
          }}>YANNI</span>
        </div>
      </Link>

      {/* Links desktop */}
      <div style={{
        display: "flex", gap: 36, alignItems: "center",
      }} className="hidden md:flex">
        {[
          { label: "Cardápio", href: "/cardapio" },
          { label: "Fidelidade", href: "/fidelidade" },
        ].map(({ label, href }) => (
          <Link key={href} href={href} style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: pathname === href ? "var(--yanni-red)" : "var(--yanni-muted)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}>{label}</Link>
        ))}
      </div>

      {/* Carrinho + Menu mobile */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/checkout" style={{ position: "relative", textDecoration: "none" }}>
          <ShoppingBag
            size={20}
            color="var(--yanni-text)"
            style={{ display: "block" }}
          />
          {totalItens > 0 && (
            <span style={{
              position: "absolute",
              top: -6, right: -6,
              background: "var(--yanni-red)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 500,
              width: 16, height: 16,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{totalItens}</span>
          )}
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
          className="md:hidden"
        >
          {menuOpen
            ? <X size={20} color="var(--yanni-text)" />
            : <Menu size={20} color="var(--yanni-text)" />
          }
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div style={{
          position: "absolute",
          top: 64, left: 0, right: 0,
          background: "#111",
          borderBottom: "1px solid var(--yanni-border)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}>
          {[
            { label: "Cardápio", href: "/cardapio" },
            { label: "Fidelidade", href: "/fidelidade" },
          ].map(({ label, href }) => (
            <Link key={href} href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 300,
                color: "var(--yanni-text)",
                textDecoration: "none",
                letterSpacing: ".05em",
              }}>{label}</Link>
          ))}
        </div>
      )}
    </nav>
  )
}
