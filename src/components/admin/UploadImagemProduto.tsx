"use client"

import { useState } from "react"
import { UploadDropzone } from "@/lib/uploadthing/components"
import Image from "next/image"
import { X, ImagePlus } from "lucide-react"
import { toast } from "sonner"

interface UploadImagemProdutoProps {
  imagemAtual?: string
  onUpload: (url: string) => void
}

export function UploadImagemProduto({ imagemAtual, onUpload }: UploadImagemProdutoProps) {
  const [preview, setPreview] = useState<string | null>(imagemAtual ?? null)
  const [uploading, setUploading] = useState(false)

  return (
    <div>
      {preview ? (
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
          <Image
            src={preview}
            alt="Preview"
            fill
            style={{ objectFit: "cover" }}
          />
          <button
            onClick={() => { setPreview(null); onUpload("") }}
            style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,0.7)",
              border: "none", borderRadius: "50%",
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <UploadDropzone
          endpoint="imagemProduto"
          onUploadBegin={() => setUploading(true)}
          onClientUploadComplete={(res) => {
            setUploading(false)
            if (res?.[0]?.url) {
              setPreview(res[0].url)
              onUpload(res[0].url)
              toast.success("Imagem enviada com sucesso!")
            }
          }}
          onUploadError={(err) => {
            setUploading(false)
            toast.error(`Erro no upload: ${err.message}`)
          }}
          appearance={{
            container: {
              border: "1px dashed rgba(255,255,255,0.1)",
              background: "#1A1A1A",
              borderRadius: 0,
              padding: "24px",
            },
            label: {
              color: "rgba(240,237,232,0.45)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
            },
            uploadIcon: { color: "rgba(240,237,232,0.2)" },
            button: {
              background: "#C8102E",
              borderRadius: 0,
              fontFamily: "var(--font-body)",
              fontSize: 12,
            },
          }}
          content={{
            label: uploading ? "Enviando..." : "Arraste ou clique para enviar",
            allowedContent: "JPG, PNG, WebP até 4MB",
            button: ({ ready }) => ready ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ImagePlus size={14} /> Escolher imagem
              </span>
            ) : "Preparando...",
          }}
        />
      )}
    </div>
  )
}
