import DOMPurify from "dompurify"

/**
 * XSS Prevention Utilities for Frontend
 * 
 * React automatically escapes content in JSX, but these utilities provide
 * additional protection for:
 * - dangerouslySetInnerHTML usage
 * - User-generated HTML content
 * - Rich text rendering
 * - URL sanitization
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving safe content
 * 
 * @param dirty - The HTML string to sanitize
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string {
  if (typeof window === "undefined") {
    // Server-side: return empty string or strip all tags
    return dirty.replace(/<[^>]*>/g, "")
  }

  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [], // Strip all HTML by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content
    ...options,
  }

  return DOMPurify.sanitize(dirty, defaultConfig)
}

/**
 * Sanitize HTML with basic formatting support
 * Allows safe HTML tags for rich text content
 * 
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML with basic formatting preserved
 */
export function sanitizeRichText(dirty: string): string {
  if (typeof window === "undefined") {
    return dirty.replace(/<[^>]*>/g, "")
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * 
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null if invalid/dangerous
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null
  }

  const trimmed = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i
  if (dangerousProtocols.test(trimmed)) {
    return null
  }

  // Allow http, https, mailto, and relative URLs
  const safeProtocols = /^(https?:\/\/|mailto:|\/)/i
  if (!safeProtocols.test(trimmed)) {
    // If no protocol and not relative, assume https
    return `https://${trimmed}`
  }

  return trimmed
}

/**
 * Sanitize text content (strip all HTML)
 * Use this for plain text that should never contain HTML
 * 
 * @param text - The text to sanitize
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(text: string): string {
  if (typeof window === "undefined") {
    return text.replace(/<[^>]*>/g, "")
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Create safe props for dangerouslySetInnerHTML
 * Only use when absolutely necessary (prefer React's automatic escaping)
 * 
 * @param html - The HTML string to sanitize
 * @param options - DOMPurify configuration options
 * @returns Object safe for dangerouslySetInnerHTML prop
 */
export function createSafeHtml(
  html: string,
  options?: DOMPurify.Config
): { __html: string } {
  return {
    __html: sanitizeHtml(html, options),
  }
}

/**
 * Create safe props for rich text rendering
 * 
 * @param html - The HTML string to sanitize
 * @returns Object safe for dangerouslySetInnerHTML prop with rich text support
 */
export function createSafeRichText(html: string): { __html: string } {
  return {
    __html: sanitizeRichText(html),
  }
}

/**
 * Validate and sanitize email address
 * 
 * @param email - The email to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== "string") {
    return null
  }

  const sanitized = sanitizeText(email).trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize filename to prevent directory traversal
 * 
 * @param filename - The filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "file"
  }

  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .substring(0, 255)
}

/**
 * Escape HTML entities in a string
 * Use this as an alternative to sanitization when you want to display HTML as text
 * 
 * @param text - The text to escape
 * @returns Text with HTML entities escaped
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Check if a URL is safe to navigate to
 * 
 * @param url - The URL to check
 * @returns true if URL is safe, false otherwise
 */
export function isSafeUrl(url: string): boolean {
  const sanitized = sanitizeUrl(url)
  return sanitized !== null
}

/**
 * Sanitize object recursively
 * Useful for sanitizing API responses before rendering
 * 
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === "string") {
    return sanitizeText(obj) as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T
  }

  if (typeof obj === "object") {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

/**
 * React hook for sanitizing HTML content
 * 
 * @param html - The HTML to sanitize
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function useSanitizedHtml(
  html: string,
  options?: DOMPurify.Config
): string {
  if (typeof window === "undefined") {
    return ""
  }

  return sanitizeHtml(html, options)
}

/**
 * Content Security Policy helpers
 */
export const CSP = {
  /**
   * Check if inline scripts are allowed (they shouldn't be in production)
   */
  isInlineScriptAllowed(): boolean {
    return process.env.NODE_ENV === "development"
  },

  /**
   * Get nonce for inline scripts (if CSP is implemented)
   */
  getNonce(): string | null {
    if (typeof window === "undefined") {
      return null
    }

    const metaTag = document.querySelector('meta[property="csp-nonce"]')
    return metaTag?.getAttribute("content") || null
  },
}

/**
 * Safe JSON parsing with XSS prevention
 * 
 * @param json - JSON string to parse
 * @returns Parsed and sanitized object
 */
export function safeParse<T>(json: string): T | null {
  try {
    const parsed = JSON.parse(json)
    return sanitizeObject(parsed)
  } catch {
    return null
  }
}

export default {
  sanitizeHtml,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeText,
  createSafeHtml,
  createSafeRichText,
  sanitizeEmail,
  sanitizeFilename,
  escapeHtml,
  isSafeUrl,
  sanitizeObject,
  useSanitizedHtml,
  CSP,
  safeParse,
}
