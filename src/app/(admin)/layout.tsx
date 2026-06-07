import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import "@/styles/globals.css"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/admin/login")

  return (
    <html lang="pt-BR">
      <body style={{ display: "flex", minHeight: "100vh", background: "var(--yanni-black)" }}>
        <AdminSidebar />
        <main style={{
          flex: 1,
          marginLeft: 240,
          padding: "32px 36px",
          maxWidth: "calc(100vw - 240px)",
          overflowX: "hidden",
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}
