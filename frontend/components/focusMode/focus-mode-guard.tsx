"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type FocusModeGuardProps = {
  children: ReactNode
  enabled?: boolean
  maxViolations?: number
}

export function FocusModeGuard({
  children,
  enabled = false,
  maxViolations = 3,
}: FocusModeGuardProps) {
  const router = useRouter()
  const [violations, setViolations] = useState(0)

  useEffect(() => {
    if (!enabled) return

    if (!localStorage.getItem("habitPlan")) {
      router.replace("/dashboard/habit-mode")
      return
    }

    const requestFullscreen = async () => {
      try {
        if (document.fullscreenElement) return
        await document.documentElement.requestFullscreen?.()
      } catch {
      }
    }

    const blockContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    const blockKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isInspectorShortcut =
        key === "f12" ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key))
      const isBlockedCtrlShortcut = (event.ctrlKey || event.metaKey) && ["u", "s", "p"].includes(key)

      if (isInspectorShortcut || isBlockedCtrlShortcut) {
        event.preventDefault()
      }
    }

    const registerViolation = () => {
      setViolations((prev) => prev + 1)
    }

    const handleVisibility = () => {
      if (document.hidden) registerViolation()
    }

    const handleBlur = () => {
      registerViolation()
    }

    requestFullscreen()
    document.addEventListener("contextmenu", blockContextMenu)
    document.addEventListener("keydown", blockKeys)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu)
      document.removeEventListener("keydown", blockKeys)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("blur", handleBlur)

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
    }
  }, [enabled, router])

  useEffect(() => {
    if (!enabled) return
    if (violations < maxViolations) return

    localStorage.removeItem("habitPlan")
    router.replace("/dashboard/habit-mode")
  }, [enabled, maxViolations, violations, router])

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="rounded-md border border-red-500 bg-red-950/60 p-4">
          <h1 className="text-xl font-semibold">Proctored Focus Mode</h1>
          <p className="mt-1 text-sm text-red-100">
            Stay on this screen. Switching tabs/windows is tracked. Violations: {violations}/{maxViolations}
          </p>
        </div>

        <div className="rounded-md bg-white p-4 text-black">{children}</div>
      </div>
    </main>
  )
}