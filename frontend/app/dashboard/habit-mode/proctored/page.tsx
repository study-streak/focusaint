"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, AlertTriangle, Maximize2, Eye, FileText, Bold, Italic, Underline, Camera, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mergeProctoredSettings, type ProctoredModePreset, type ProctoredSettings } from "@/lib/proctored-presets"
import html2canvas from "html2canvas"

type Attachment = {
  _id: string
  type: "file" | "link"
  name: string
  url: string
  mimeType?: string
}

function ProctoredModePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId")
  const attachmentId = searchParams.get("attachmentId")
  const modeParam = searchParams.get("mode")
  const selectedPreset: ProctoredModePreset = modeParam === "deep" ? "deep" : "quick"

  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [proctoredSettings, setProctoredSettings] = useState<ProctoredSettings | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [needsF11Fallback, setNeedsF11Fallback] = useState(false)
  const [violations, setViolations] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [notesHtml, setNotesHtml] = useState("")
  const [notesFocused, setNotesFocused] = useState(false)
  const [textSize, setTextSize] = useState("3")
  const [showNotes, setShowNotes] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pdfTotalPages, setPdfTotalPages] = useState(0)
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [activePreset, setActivePreset] = useState<ProctoredModePreset>(selectedPreset)
  const containerRef = useRef<HTMLDivElement>(null)
  const studyAreaRef = useRef<HTMLDivElement>(null)
  const notesEditorRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const captureStreamRef = useRef<MediaStream | null>(null)
  const captureVideoRef = useRef<HTMLVideoElement | null>(null)


  const stopPersistentCaptureStream = useCallback(() => {
    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach((track) => track.stop())
      captureStreamRef.current = null
    }
    captureVideoRef.current = null
  }, [])

  const ensurePersistentCaptureVideo = useCallback(async () => {
    const existingStream = captureStreamRef.current
    if (existingStream && existingStream.getVideoTracks().some((track) => track.readyState === "live")) {
      if (captureVideoRef.current) {
        return captureVideoRef.current
      }

      const existingVideo = document.createElement("video")
      existingVideo.srcObject = existingStream
      existingVideo.muted = true
      await existingVideo.play()
      captureVideoRef.current = existingVideo
      return existingVideo
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
      },
      audio: false,
      // Browser-specific hints (Chrome/Edge). They reduce non-current-surface options where supported.
      // Type cast keeps TS happy across browsers that don't yet expose these fields.
      ...( {
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        monitorTypeSurfaces: "exclude",
        surfaceSwitching: "exclude",
      } as any),
    } as MediaStreamConstraints)

    const video = document.createElement("video")
    video.srcObject = stream
    video.muted = true
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve()
    })
    await video.play()

    captureStreamRef.current = stream
    captureVideoRef.current = video
    return video
  }, [])

  const isCanvasLikelyBlank = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d")
    if (!context) return true

    const sampleSize = 24
    const stepX = Math.max(1, Math.floor(canvas.width / sampleSize))
    const stepY = Math.max(1, Math.floor(canvas.height / sampleSize))

    let minR = 255
    let minG = 255
    let minB = 255
    let maxR = 0
    let maxG = 0
    let maxB = 0

    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        const pixel = context.getImageData(x, y, 1, 1).data
        const r = pixel[0]
        const g = pixel[1]
        const b = pixel[2]

        minR = Math.min(minR, r)
        minG = Math.min(minG, g)
        minB = Math.min(minB, b)
        maxR = Math.max(maxR, r)
        maxG = Math.max(maxG, g)
        maxB = Math.max(maxB, b)
      }
    }

    const rangeR = maxR - minR
    const rangeG = maxG - minG
    const rangeB = maxB - minB
    return rangeR < 6 && rangeG < 6 && rangeB < 6
  }

  const captureFromPersistentStream = useCallback(
    async (
      studyRect: DOMRect,
      selection: { x: number; y: number; width: number; height: number }
    ) => {
      try {
        const video = await ensurePersistentCaptureVideo()
        const scaleX = video.videoWidth / window.innerWidth
        const scaleY = video.videoHeight / window.innerHeight

        const selectionLeft = studyRect.left + selection.x
        const selectionTop = studyRect.top + selection.y
        const sx = Math.max(0, Math.floor(selectionLeft * scaleX))
        const sy = Math.max(0, Math.floor(selectionTop * scaleY))
        const sw = Math.max(1, Math.min(video.videoWidth - sx, Math.floor(selection.width * scaleX)))
        const sh = Math.max(1, Math.min(video.videoHeight - sy, Math.floor(selection.height * scaleY)))

        const canvas = document.createElement("canvas")
        canvas.width = sw
        canvas.height = sh

        const context = canvas.getContext("2d")
        if (!context) {
          throw new Error("Failed to create screenshot context")
        }

        context.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

        if (proctoredSettings?.requireFullScreen && !document.fullscreenElement) {
          setNeedsF11Fallback(true)
        }

        return canvas
      } finally {
        stopPersistentCaptureStream()
      }
    },
    [ensurePersistentCaptureVideo, stopPersistentCaptureStream, proctoredSettings?.requireFullScreen]
  )

  
  useEffect(() => {
    return () => {
      stopPersistentCaptureStream()
    }
  }, [stopPersistentCaptureStream])

  const getApiOrigin = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
    if (!apiUrl) return ""

    try {
      return new URL(apiUrl).origin
    } catch {
      return ""
    }
  }, [])

  const resolveAttachmentUrl = useCallback(
    (url: string) => {
      if (!url) return ""
      if (url.startsWith("http://") || url.startsWith("https://")) return url
      const apiOrigin = getApiOrigin()
      if (!apiOrigin) return url
      if (url.startsWith("/")) return `${apiOrigin}${url}`
      return `${apiOrigin}/${url}`
    },
    [getApiOrigin]
  )

  const toYouTubeEmbedUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url)
      let videoId = ""
      console.log(parsed)
      if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.replace("/", "").split("?")[0]
      } else if (parsed.hostname.includes("youtube.com")) {
        if (parsed.pathname.startsWith("/embed/")) {
          videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || ""
        } else {
          videoId = parsed.searchParams.get("v") || ""
        }
      }

      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
      }
    } catch {
    }

    return ""
  }, [])

  const isPdfUrl = useCallback((url: string, mimeType?: string, fileName?: string) => {
    if (mimeType?.toLowerCase().includes("pdf")) return true
    if (/\.pdf($|\?)/i.test(url)) return true
    return /\.pdf$/i.test(fileName || "")
  }, [])

  // Fetch proctored task data on mount
  useEffect(() => {
    if (!taskId) {
      console.error("No taskId provided")
      setTimeout(() => router.push("/dashboard/habit-mode"), 1000)
      return
    }

    const fetchProctoredData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          console.error("No authentication token found")
          throw new Error("Not authenticated")
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}/proctored`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch proctored data")
        }

        const data = await response.json()
        console.log("Proctored data loaded:", data)
        
        const rawSettings = data.task?.proctoredSettings || data.proctoredSettings
        const serverPreset = data.task?.proctoredPreset === "deep" ? "deep" : "quick"
        const effectivePreset = (modeParam === "deep" || modeParam === "quick") ? selectedPreset : serverPreset
        setActivePreset(effectivePreset)
        const resolvedSettings = mergeProctoredSettings(rawSettings, effectivePreset)
        setProctoredSettings(resolvedSettings)

        // Find the specific attachment
        if (attachmentId) {
          const attachments = data.task?.attachments || data.attachments
          if (attachments) {
            const found = attachments.find((a: Attachment) => a._id === attachmentId)
            if (found) {
              setAttachment(found)
            } else {
              console.error("Attachment not found", attachmentId, attachments)
            }
          }
        }

        // Set time limit timer if configured
        const settings = resolvedSettings
        if (settings?.timeLimit) {
          setTimeLeft(settings.timeLimit * 60) // Convert to seconds
        }

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch proctored data:", error)
        setTimeout(() => router.push("/dashboard/habit-mode"), 1000)
      }
    }

    fetchProctoredData()
  }, [taskId, attachmentId, router])

  const addViolation = useCallback((violation: string) => {
    setViolations((prev) => {
      if (!prev.includes(violation)) {
        return [...prev, violation]
      }
      return prev
    })
  }, [])

  const endProctoredSessionFn = useCallback(async () => {
    if (!taskId || sessionEnded) return

    setSessionEnded(true)

    // Exit fullscreen if in it
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.error("Error exiting fullscreen:", e)
    }

    try {
      const token = localStorage.getItem("token")
      // 1. End proctored session
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}/proctored/end`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attachmentId,
            violations,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to end session")

      // 2. Mark attachment as complete (triggers streak update if all complete)
      if (taskId && attachmentId) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}/attachment/${attachmentId}/complete`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
      }

      stopPersistentCaptureStream()

      console.log("Session ended and attachment marked complete")
      // Show completion message and redirect after 3 seconds
      setTimeout(() => {
        router.replace("/dashboard/habit-mode")
      }, 3000)
      // Guard: If session ended, redirect to habit mode
      useEffect(() => {
        if (sessionEnded) {
          router.replace("/dashboard/habit-mode");
        }
      }, [sessionEnded, router]);
    } catch (error) {
      console.error("Failed to end proctored session:", error)
    }
  }, [taskId, attachmentId, violations, sessionEnded, stopPersistentCaptureStream])

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || sessionEnded) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endProctoredSessionFn()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, sessionEnded, endProctoredSessionFn])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen =
        document.fullscreenElement !== null ||
        (document as any).webkitFullscreenElement !== null ||
        (document as any).mozFullScreenElement !== null

      setIsFullScreen(isCurrentlyFullScreen)
      if (isCurrentlyFullScreen) {
        setNeedsF11Fallback(false)
      }

      if (!isCurrentlyFullScreen && proctoredSettings?.requireFullScreen && !sessionEnded) {
        addViolation("left_fullscreen")
      }
    }

    document.addEventListener("fullscreenchange", handleFullScreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange)
    document.addEventListener("mozfullscreenchange", handleFullScreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullScreenChange)
    }
  }, [proctoredSettings, sessionEnded, addViolation])

  // Copy-paste prevention
  useEffect(() => {
    if (!proctoredSettings?.disableCopyPaste) return

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      addViolation("copy_paste_attempt")
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      addViolation("right_click_attempt")
    }

    document.addEventListener("copy", handleCopy)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [proctoredSettings?.disableCopyPaste, addViolation])

  // Prevent text selection if needed
  useEffect(() => {
    if (!proctoredSettings?.disableCopyPaste) return

    const style = document.createElement("style")
    style.textContent = "* { user-select: none !important; }"
    document.head.appendChild(style)

    return () => {
      try {
        document.head.removeChild(style)
      } catch (e) {
        // Style element might have been removed
      }
    }
  }, [proctoredSettings?.disableCopyPaste])

  const requestFullScreen = useCallback(async () => {
    try {
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen()
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen()
      }
    } catch (error) {
      setNeedsF11Fallback(true)
      console.error("Fullscreen request failed:", error)
    }
  }, [])

  useEffect(() => {
    if (!proctoredSettings?.requireFullScreen || isFullScreen || sessionEnded) return

    let cancelled = false

    const tryEnterFullscreen = async () => {
      if (cancelled || document.fullscreenElement || sessionEnded) return
      await requestFullScreen()
      if (!document.fullscreenElement && !cancelled) {
        setNeedsF11Fallback(true)
      }
    }

    // Immediate attempt on mount/settings load
    tryEnterFullscreen()

    // Retry shortly after hydration/paint for browsers that need settled layout
    const retryTimer = window.setTimeout(() => {
      tryEnterFullscreen()
    }, 250)

    // Interaction fallback: keep trying on user interactions until fullscreen is entered
    const handleFirstInteraction = () => {
      tryEnterFullscreen()
    }

    window.addEventListener("pointerdown", handleFirstInteraction)
    window.addEventListener("keydown", handleFirstInteraction)
    window.addEventListener("touchstart", handleFirstInteraction)

    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      window.removeEventListener("pointerdown", handleFirstInteraction)
      window.removeEventListener("keydown", handleFirstInteraction)
      window.removeEventListener("touchstart", handleFirstInteraction)
    }
  }, [proctoredSettings?.requireFullScreen, isFullScreen, sessionEnded, requestFullScreen])

  useEffect(() => {
    if (!proctoredSettings?.requireFullScreen || isFullScreen || sessionEnded) return

    const retryOnFocus = () => {
      requestFullScreen()
    }

    const retryOnVisibility = () => {
      if (!document.hidden) {
        requestFullScreen()
      }
    }

    window.addEventListener("focus", retryOnFocus)
    document.addEventListener("visibilitychange", retryOnVisibility)

    return () => {
      window.removeEventListener("focus", retryOnFocus)
      document.removeEventListener("visibilitychange", retryOnVisibility)
    }
  }, [proctoredSettings?.requireFullScreen, isFullScreen, sessionEnded, requestFullScreen])

  const renderPdfPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !pdfCanvasRef.current) return

    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1})
      const wrapperWidth = pdfCanvasRef.current.parentElement!.clientWidth;
      const scale = wrapperWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current
      const context = canvas.getContext("2d")

      if (!context) return

      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height

      await (page.render({  canvasContext: context, viewport : scaledViewport }) as any).promise
      setPdfCurrentPage(pageNum)
    } catch (error) {
      console.error("Error rendering PDF page:", error)
    }
  }, [pdfDoc])

  useEffect(() => {
    if (!attachment) return

    const loadPdf = async () => {
      try {
        const resolvedUrl = resolveAttachmentUrl(attachment.url)
        // Check if it's a PDF before proceeding
        if (!isPdfUrl(resolvedUrl, attachment.mimeType, attachment.name)) {
          return
        }

        setPdfLoading(true)
        
        // Dynamic import to avoid SSR issues with browser-dependent code
        const pdfjsLib = await import("pdfjs-dist")
        
        // Try to use local worker file first, fallback to CDN
        try {
          const response = await fetch("/pdf.worker.min.mjs", { method: "HEAD" })
          if (response.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
          } else {
            throw new Error("Local worker not found")
          }
        } catch {
          // Fallback to absolute CDN URL
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        }

        const doc = await pdfjsLib.getDocument(resolvedUrl).promise
        setPdfDoc(doc)
        setPdfTotalPages(doc.numPages)
        setPdfCurrentPage(1)

        // Render first page
        const pageNum = 1
        const page = await doc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2 })
        
        // Wait for canvas ref to be available
        if (pdfCanvasRef.current) {
          const canvas = pdfCanvasRef.current
          const context = canvas.getContext("2d")
          if (context) {
            canvas.width = viewport.width
            canvas.height = viewport.height
            await (page.render({ canvas, canvasContext: context, viewport }) as any).promise
          }
        }
        
        setPdfLoading(false)
      } catch (error) {
        console.error("Error loading PDF:", error)
        setPdfLoading(false)
      }
    }

    loadPdf()
  }, [attachment, resolveAttachmentUrl, isPdfUrl])

  const focusNotesEditor = () => {
    if (!notesEditorRef.current) return
    notesEditorRef.current.focus()
  }

  const applyEditorCommand = (command: string, value?: string) => {
    focusNotesEditor()
    document.execCommand(command, false, value)
    setNotesHtml(notesEditorRef.current?.innerHTML || "")
  }

  const handleTextSizeChange = (value: string) => {
    setTextSize(value)
    applyEditorCommand("fontSize", value)
  }

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isModifierPressed = e.ctrlKey || e.metaKey
    if (!isModifierPressed) return

    const key = e.key.toLowerCase()
    if (key === "b") {
      e.preventDefault()
      applyEditorCommand("bold")
      return
    }

    if (key === "i") {
      e.preventDefault()
      applyEditorCommand("italic")
      return
    }

    if (key === "u") {
      e.preventDefault()
      applyEditorCommand("underline")
    }
  }

  const captureFrameScreenshot = async () => {
    try {
      const studyRect = studyAreaRef.current?.getBoundingClientRect()
      const studyArea = studyAreaRef.current
      if (!studyArea || !studyRect || studyRect.width <= 0 || studyRect.height <= 0) {
        throw new Error("Study area is not available")
      }

      const fullCanvas = await html2canvas(studyArea, {
        backgroundColor: "#070b14",
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: window.devicePixelRatio || 1,
      })

      const selection = { x: 0, y: 0, width: studyRect.width, height: studyRect.height }

      const scaleX = fullCanvas.width / studyRect.width
      const scaleY = fullCanvas.height / studyRect.height
      const sx = Math.max(0, Math.floor(selection.x * scaleX))
      const sy = Math.max(0, Math.floor(selection.y * scaleY))
      const sw = Math.max(1, Math.min(fullCanvas.width - sx, Math.floor(selection.width * scaleX)))
      const sh = Math.max(1, Math.min(fullCanvas.height - sy, Math.floor(selection.height * scaleY)))

      const canvas = document.createElement("canvas")
      canvas.width = sw
      canvas.height = sh

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Failed to create screenshot context")
      }

      ctx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh)

      let finalCanvas = canvas
      if (isCanvasLikelyBlank(canvas)) {
        finalCanvas = await captureFromPersistentStream(studyRect, selection)
      }

      const imageData = finalCanvas.toDataURL("image/png")

      focusNotesEditor()
      document.execCommand("insertHTML", false, `<p><img src="${imageData}" alt="Video frame screenshot" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" /></p>`)
      setNotesHtml(notesEditorRef.current?.innerHTML || "")
    } catch (error) {
      console.error("Screenshot capture failed:", error)
      alert("Unable to capture this region. If prompted, allow screen capture for this screenshot.")
    }
  }



  const saveNotesAsPdf = () => {
    const printable = notesEditorRef.current?.innerHTML || ""
    if (!printable.trim()) {
      alert("No notes to export")
      return
    }

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to save notes as PDF.")
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Proctored Notes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.5; color: #111; }
            h1 { font-size: 20px; margin-bottom: 12px; }
            .meta { color: #555; font-size: 12px; margin-bottom: 20px; }
            img { max-width: 100%; height: auto; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>Proctored Session Notes</h1>
          <div class="meta">Generated on ${new Date().toLocaleString()}</div>
          <div>${printable}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-300 mb-2">Loading proctored session...</div>
          <div className="text-xs text-slate-500">TaskID: {taskId}</div>
        </div>
      </div>
    )
  }

  if (!attachment) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Attachment not found</div>
          <div className="text-xs text-slate-500">AttachmentID: {attachmentId}</div>
          <Button
            onClick={() => router.push("/dashboard/habit-mode")}
            className="mt-4"
          >
            Back to Planner
          </Button>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const resolvedUrl = resolveAttachmentUrl(attachment.url)
  const youtubeEmbedUrl = attachment.type === "link" ? toYouTubeEmbedUrl(resolvedUrl) : ""
  const showPdfInline = isPdfUrl(resolvedUrl, attachment.mimeType, attachment.name)

  return (
    <div ref={containerRef} className="min-h-screen bg-[#070b14] flex flex-col">
      {/* Proctored header */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/15 p-4 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-xs text-slate-400">PROCTORED MODE</p>
            <p className="text-sm font-semibold text-slate-100">{attachment.name} · {activePreset === "deep" ? "Deep" : "Quick"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeLeft > 0 && (
            <div className={`text-sm font-mono ${timeLeft < 60 ? "text-red-400" : "text-slate-300"}`}>
              {formatTime(timeLeft)}
            </div>
          )}

          {violations.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/20 border border-red-500/50">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">{violations.length} violation{violations.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNotes(!showNotes)}
            className="text-slate-300 hover:text-slate-100 hover:bg-white/10 gap-2"
            title="Toggle notes panel"
          >
            <FileText className="w-4 h-4" />
            Notes
          </Button>

          {proctoredSettings?.requireFullScreen && !isFullScreen && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setNeedsF11Fallback(false)
                  requestFullScreen()
                }}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                {needsF11Fallback ? "Retry Fullscreen" : "Fullscreen"}
              </Button>
              {needsF11Fallback && (
                <span className="text-xs text-amber-300">After permission dialog, press F11 again if fullscreen exits.</span>
              )}
            </div>
          )}

          {sessionEnded ? (
            <div className="text-sm text-green-400 font-semibold">Session ended ✓</div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={endProctoredSessionFn}
              className="border-red-500/50 hover:bg-red-500/20 text-red-400 gap-2"
            >
              <X className="w-4 h-4" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Content + Notes layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Content area */}
        <div className={`relative flex-1 overflow-auto p-2 md:p-4 flex items-center justify-center transition-all ${
          showNotes ? "md:border-r border-white/10" : ""
        }`} ref={studyAreaRef}>
          {sessionEnded ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mx-auto mb-4">
                <div className="text-green-400 text-xl">✓</div>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mb-2">Proctored Session Completed</h2>
              <p className="text-sm text-slate-400 mb-4">Your session has been recorded. Redirecting...</p>
              {violations.length > 0 && (
                <div className="text-xs text-slate-500 mt-4 p-3 bg-white/6 rounded">
                  <p className="font-semibold text-slate-300 mb-2">Detected Activities:</p>
                  {violations.map((v) => (
                    <p key={v}>{v.replace(/_/g, " ")}</p>
                  ))}
                </div>
              )}
            </div>
          ) : youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              className="w-full h-[220px] md:h-full border border-white/15 rounded"
              title={attachment.name}
              sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : showPdfInline ? (
            <div className="w-full h-[220px] md:h-full flex flex-col border border-white/15 rounded bg-white overflow-hidden">
              {pdfLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-slate-500">Loading PDF...</div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto flex items-center justify-center">
                    <canvas
                      ref={pdfCanvasRef}
                      className="max-w-full max-h-full"
                    />
                  </div>
                  {pdfTotalPages > 1 && (
                    <div className="bg-slate-100 border-t border-slate-300 p-2 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (pdfCurrentPage > 1) {
                            renderPdfPage(pdfCurrentPage - 1)
                          }
                        }}
                        disabled={pdfCurrentPage <= 1}
                        className="h-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-slate-600">
                        Page {pdfCurrentPage} of {pdfTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (pdfCurrentPage < pdfTotalPages) {
                            renderPdfPage(pdfCurrentPage + 1)
                          }
                        }}
                        disabled={pdfCurrentPage >= pdfTotalPages}
                        className="h-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : attachment.type === "link" ? (
            <iframe
              src={resolvedUrl}
              className="w-full h-full border border-white/15 rounded"
              title={attachment.name}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          ) : (
            // For file attachments (PDF, documents)
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-300 mb-4">File: {attachment.name}</p>
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  Open in New Window (Proctored)
                </a>
                <p className="text-xs text-slate-500 mt-4">
                  Note: In proctored mode, copying and leaving fullscreen will be recorded as violations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="w-full md:w-80 bg-white/3 md:border-l border-white/15 backdrop-blur-xl flex flex-col overflow-hidden mt-4 md:mt-0">
            <div className="px-4 py-3 border-b border-white/10 bg-white/6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">NOTES & MEMO</p>
                <button
                  onClick={() => setShowNotes(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Jot down important points</p>

              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyEditorCommand("bold")}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-slate-100 hover:bg-white/10 flex-shrink-0"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyEditorCommand("italic")}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-slate-100 hover:bg-white/10 flex-shrink-0"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyEditorCommand("underline")}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-slate-100 hover:bg-white/10 flex-shrink-0"
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </Button>
                <select
                  value={textSize}
                  onChange={(e) => handleTextSizeChange(e.target.value)}
                  className="h-7 rounded bg-slate-900/45 border border-white/15 text-slate-200 text-xs px-2 flex-shrink-0"
                  title="Text size"
                >
                  <option value="2">Small</option>
                  <option value="3">Normal</option>
                  <option value="4">Large</option>
                  <option value="5">XL</option>
                </select>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={captureFrameScreenshot}
                  className="h-7 text-slate-300 hover:text-slate-100 hover:bg-white/10 gap-1.5 px-2 flex-shrink-0"
                  title="Capture screenshot"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Shot
                </Button>
              </div>
            </div>

            <div className="relative flex-1 overflow-auto p-4">
              {!notesFocused && !notesHtml.replace(/<[^>]*>/g, "").trim() && (
                <div className="absolute top-4 left-4 right-4 text-xs text-slate-500 pointer-events-none whitespace-pre-line">
                  {`Take notes here...
• Key concepts
• Important formulas
• Questions to ask
• Summary points`}
                </div>
              )}
              <div
                ref={notesEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setNotesHtml((e.target as HTMLDivElement).innerHTML)}
                onKeyDown={handleNotesKeyDown}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                className="min-h-full text-slate-200 text-xs focus:outline-none"
              />
            </div>

            <div className="px-4 py-3 border-t border-white/10 bg-white/6 text-xs text-slate-400 flex items-center justify-between gap-2">
              <span>{notesHtml.replace(/<[^>]*>/g, "").length} characters</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={saveNotesAsPdf}
                className="h-7 text-slate-300 hover:text-slate-100 hover:bg-white/10 gap-1.5 px-2"
                title="Save notes as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Save to PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Violation warning */}
      {violations.length > 0 && (
        <div className="bg-red-500/10 border-t border-red-500/20 p-3 backdrop-blur-xl">
          <p className="text-xs text-red-300">
            ⚠ Violations detected: {violations.map((v) => v.replace(/_/g, " ")).join(", ")}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ProctoredModePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center"><p className="text-slate-300">Loading...</p></div>}>
      <ProctoredModePageContent />
    </Suspense>
  )
}
