export function extractYouTubeVideoId(rawInput?: string): string | null {
  if (!rawInput) return null

  const trimmed = rawInput.trim()
  if (!trimmed) return null

  const maybeDecoded = safeDecode(trimmed)
  const withProtocol = normalizeProtocol(maybeDecoded)

  try {
    const url = new URL(withProtocol)
    const hostname = url.hostname.replace(/^www\./, '').replace(/^m\./, '')

    if (hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] || ''
      return isValidYouTubeId(id) ? id : null
    }

    if (hostname.endsWith('youtube.com')) {
      const directVideoId = url.searchParams.get('v')
      if (isValidYouTubeId(directVideoId || '')) return directVideoId

      const parts = url.pathname.split('/').filter(Boolean)
      const candidate =
        parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live'
          ? parts[1]
          : ''

      return isValidYouTubeId(candidate || '') ? candidate : null
    }
  } catch {
    const regexFallback = maybeDecoded.match(/(?:v=|be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/)
    if (regexFallback?.[1]) return regexFallback[1]
  }

  return null
}

export function toYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`
}

export function recoverUrlFromSegments(segments: string[]): string {
  if (!segments.length) return ''

  const joined = segments.join('/')
  const decoded = safeDecode(joined)

  if (decoded.startsWith('https:/') && !decoded.startsWith('https://')) {
    return decoded.replace(/^https:\//, 'https://')
  }

  if (decoded.startsWith('http:/') && !decoded.startsWith('http://')) {
    return decoded.replace(/^http:\//, 'http://')
  }

  if (/^(www\.)?(youtube\.com|youtu\.be)/i.test(decoded)) {
    return `https://${decoded}`
  }

  return decoded
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeProtocol(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  if (/^(www\.)?(youtube\.com|youtu\.be)/i.test(value)) return `https://${value}`
  return value
}

function isValidYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}
