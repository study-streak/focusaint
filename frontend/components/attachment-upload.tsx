"use client"

import { useState } from "react"
import { Upload, X, Link as LinkIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AttachmentUploadProps = {
  taskId: string
  onAttachmentAdded: () => void
}

export function AttachmentUpload({ taskId, onAttachmentAdded }: AttachmentUploadProps) {
  const [attachmentType, setAttachmentType] = useState<"file" | "link">("link")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkName, setLinkName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  const handleAddAttachment = async () => {
    if (!taskId) return

    setError("")
    setUploading(true)

    try {
      const token = localStorage.getItem("token")
      let response: Response

      if (attachmentType === "link") {
        if (!linkUrl || !linkName) {
          setError("Please fill in link name and URL")
          setUploading(false)
          return
        }

        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}/attachment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "link",
              name: linkName,
              url: linkUrl,
            }),
          }
        )
      } else {
        if (!file) {
          setError("Please select a file")
          setUploading(false)
          return
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("name", fileName || file.name)

        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}/attachment/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        )
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || data.message || "Failed to add attachment")
      }

      // Reset form
      setLinkUrl("")
      setLinkName("")
      setFile(null)
      setFileName("")
      onAttachmentAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3 p-3 rounded-lg bg-white/6 border border-white/15">
      <p className="text-xs font-semibold text-slate-400">ADD ATTACHMENT</p>

      {error && (
        <div className="text-xs text-red-400 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Type selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setAttachmentType("link")}
          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
            attachmentType === "link"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
              : "bg-white/6 text-slate-400 border border-white/10 hover:bg-white/10"
          }`}
        >
          <LinkIcon className="w-3 h-3 inline mr-1" />
          Link
        </button>
        <button
          onClick={() => setAttachmentType("file")}
          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
            attachmentType === "file"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
              : "bg-white/6 text-slate-400 border border-white/10 hover:bg-white/10"
          }`}
        >
          <FileText className="w-3 h-3 inline mr-1" />
          File
        </button>
      </div>

      {/* Input fields */}
      {attachmentType === "link" ? (
        <div className="space-y-2">
          <Input
            placeholder="Link name (e.g., Course PDF)"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="bg-slate-900/45 border-white/15 text-slate-100 placeholder:text-slate-500 h-8"
          />
          <Input
            placeholder="URL (https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            type="url"
            className="bg-slate-900/45 border-white/15 text-slate-100 placeholder:text-slate-500 h-8"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="file"
            onChange={handleFileChange}
            className="text-xs text-slate-400 file:mr-2 file:px-3 file:py-1 file:rounded file:bg-cyan-500/20 file:border file:border-cyan-500/50 file:text-cyan-300 file:cursor-pointer"
          />
          {file && (
            <div className="text-xs text-slate-300 p-2 rounded bg-white/6 border border-white/10">
              {fileName} ({(file.size / 1024 / 1024).toFixed(2)}MB)
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      <Button
        onClick={handleAddAttachment}
        disabled={uploading || (attachmentType === "link" ? !linkName || !linkUrl : !file)}
        size="sm"
        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 border-0 h-8 text-xs gap-1.5"
      >
        <Upload className="w-3 h-3" />
        {uploading ? "Adding..." : "Add Attachment"}
      </Button>
    </div>
  )
}
