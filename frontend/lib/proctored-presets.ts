export type ProctoredModePreset = "quick" | "deep"

export type ProctoredSettings = {
  disableCopyPaste?: boolean
  requireFullScreen?: boolean
  lockScreen?: boolean
  trackActivity?: boolean
  timeLimit?: number
}

export const PROCTORED_MODE_PRESETS: Record<ProctoredModePreset, ProctoredSettings> = {
  quick: {
    disableCopyPaste: true,
    requireFullScreen: true,
    lockScreen: false,
    trackActivity: true,
    timeLimit: 25,
  },
  deep: {
    disableCopyPaste: true,
    requireFullScreen: true,
    lockScreen: true,
    trackActivity: true,
    timeLimit: 60,
  },
}

export function resolveProctoredPreset(settings?: ProctoredSettings | null): ProctoredModePreset {
  if (!settings) return "quick"
  if (settings.lockScreen || (settings.timeLimit ?? 0) >= (PROCTORED_MODE_PRESETS.deep.timeLimit || 60)) {
    return "deep"
  }
  return "quick"
}

export function mergeProctoredSettings(
  settings?: ProctoredSettings | null,
  preset?: ProctoredModePreset | null,
): ProctoredSettings {
  if (!preset) {
    return { ...(settings || {}) }
  }

  return {
    ...PROCTORED_MODE_PRESETS[preset],
    ...(settings || {}),
  }
}