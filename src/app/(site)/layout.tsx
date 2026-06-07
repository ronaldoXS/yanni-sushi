import type { Metadata } from "next"
import "@/styles/globals.css"
import { Navbar } from "@/components/site/Navbar"
import { CartProvider } from "@/components/site/CartProvider"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Yanni Sushi — Sabor Japonês Autêntico",
  description: "Delivery e retirada. Sushi artesanal feito com ingredientes selecionados.",
  themeColor: "#080808",
  openGraph: {
    title: "Yanni Sushi",
    description: "Sabor japonês autêntico. Peça agora.",
    images: ["/og-image.jpg"],
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#F0EDE8",
                fontFamily: "var(--font-body)",
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  )
}
