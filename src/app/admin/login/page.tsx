"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: "", senha: "" })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro("")
    const res = await signIn("credentials", {
      email: form.email,
      senha: form.senha,
      redirect: false,
    })
    if (res?.ok) {
      router.push("/admin/dashboard")
    } else {
      setErro("E-mail ou senha incorretos")
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--yanni-black)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48,
            background: "var(--yanni-red)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <span style={{ fontFamily: "var(--font-display)", color: "#fff", fontSize: 22, fontWeight: 600 }}>Y</span>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, letterSpacing: ".2em", color: "var(--yanni-text)" }}>
            YANNI SUSHI
          </p>
          <p style={{ fontSize: 12, color: "var(--yanni-muted)", marginTop: 6, letterSpacing: ".05em" }}>
            Painel Administrativo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@yannisushi.com.br"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={form.senha}
                onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--yanni-muted)",
                }}
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {erro && (
            <p style={{
              fontSize: 13, color: "var(--yanni-red)",
              background: "rgba(200,16,46,0.08)",
              border: "1px solid rgba(200,16,46,0.2)",
              padding: "10px 14px",
            }}>{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 8, height: 48 }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
  textTransform: "uppercase", color: "var(--yanni-muted)",
  marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--yanni-surface)",
  border: "1px solid var(--yanni-border)",
  padding: "12px 16px",
  color: "var(--yanni-text)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
}
