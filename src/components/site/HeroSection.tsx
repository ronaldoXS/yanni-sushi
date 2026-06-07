"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75
    }
  }, [])

  return (
    <section style={{ position: "relative", height: "100svh", overflow: "hidden" }}>

      {/* Vídeo background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.35,
        }}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Overlay gradiente */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.5) 60%, rgba(8,8,8,1) 100%)",
      }} />

      {/* Linha decorativa vermelha */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 1,
        height: "30%",
        background: "linear-gradient(to bottom, transparent, var(--yanni-red))",
        opacity: 0.6,
      }} />

      {/* Conteúdo principal */}
      <div style={{
        position: "relative",
        zIndex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 24px",
      }}>

        {/* Subtítulo acima */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
          animation: "fadeUp 0.8s ease 0.2s both",
        }}>
          <div style={{ width: 40, height: 1, background: "var(--yanni-red)" }} />
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "var(--yanni-muted)",
          }}>Autêntico · Artesanal · Fresco</span>
          <div style={{ width: 40, height: 1, background: "var(--yanni-red)" }} />
        </div>

        {/* Título principal */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(52px, 10vw, 120px)",
          fontWeight: 300,
          lineHeight: 0.9,
          letterSpacing: "-.02em",
          color: "var(--yanni-text)",
          marginBottom: 8,
          animation: "fadeUp 0.8s ease 0.35s both",
        }}>
          YANNI
        </h1>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(18px, 3.5vw, 36px)",
          fontWeight: 300,
          letterSpacing: ".4em",
          color: "var(--yanni-red)",
          textTransform: "uppercase",
          marginBottom: 48,
          animation: "fadeUp 0.8s ease 0.45s both",
        }}>
          SUSHI
        </h2>

        {/* Mensagem do chef (configurável) */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(14px, 2vw, 17px)",
          fontWeight: 300,
          color: "var(--yanni-muted)",
          maxWidth: 420,
          lineHeight: 1.7,
          marginBottom: 52,
          animation: "fadeUp 0.8s ease 0.55s both",
        }}>
          Ingredientes selecionados, técnica japonesa e o cuidado de quem
          vive pelo que faz.
        </p>

        {/* CTAs */}
        <div style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          animation: "fadeUp 0.8s ease 0.65s both",
        }}>
          <Link href="/cardapio" className="btn-primary">
            Ver cardápio
            <ArrowRight size={16} />
          </Link>
          <Link href="/fidelidade" className="btn-ghost">
            Programa de pontos
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        animation: "fadeIn 1s ease 1.2s both",
      }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: 10,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--yanni-muted)",
        }}>Scroll</span>
        <div style={{
          width: 1,
          height: 40,
          background: "linear-gradient(to bottom, var(--yanni-muted), transparent)",
        }} />
      </div>
    </section>
  )
}
