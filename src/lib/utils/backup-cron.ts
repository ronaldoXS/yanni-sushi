import cron from "node-cron"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

const BACKUP_DIR = path.join(process.cwd(), "backups")

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

/**
 * Backup diário às 03:00 (horário de Brasília)
 * Compatível com Neon.tech via pg_dump
 */
cron.schedule(
  "0 3 * * *",
  async () => {
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `yanni-sushi-backup-${timestamp}.sql`
    const filepath = path.join(BACKUP_DIR, filename)

    try {
      const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL
      await execAsync(`pg_dump "${dbUrl}" -f "${filepath}" --no-password`)

      // Mantém apenas os últimos 30 backups
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort()
        .reverse()

      files.slice(30).forEach((f) => {
        fs.unlinkSync(path.join(BACKUP_DIR, f))
      })

      console.log(`[BACKUP] Sucesso: ${filename}`)
    } catch (err) {
      console.error("[BACKUP] Falha:", err)
    }
  },
  { timezone: "America/Fortaleza" }
)

console.log("[BACKUP] Cron agendado — 03:00 America/Fortaleza")
