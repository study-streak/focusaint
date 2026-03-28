"use client"

import React from "react"
import { sanitizeHtml, sanitizeRichText } from "@/lib/sanitize"
import DOMPurify from "dompurify"

interface SafeHtmlProps {
  /**
   * The HTML content to render
   */
  html: string

  /**
   * Whether to allow rich text formatting (bold, italic, links, etc.)
   * Default: false (strips all HTML)
   */
  allowRichText?: boolean

  /**
   * Custom DOMPurify configuration
   */
  config?: DOMPurify.Config

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * HTML element to render as
   * Default: "div"
   */
  as?: keyof JSX.IntrinsicElements
}

/**
 * SafeHtml Component
 * 
 * Safely renders user-generated HTML content with XSS protection.
 * Uses DOMPurify to sanitize HTML before rendering.
 * 
 * ⚠️ Only use this component when you need to render HTML content.
 * For plain text, use regular React rendering which automatically escapes content.
 * 
 * @example
 * // Plain text (strips all HTML)
 * <SafeHtml html={userContent} />
 * 
 * @example
 * // Rich text (allows safe formatting)
 * <SafeHtml html={userContent} allowRichText />
 * 
 * @example
 * // Custom configuration
 * <SafeHtml 
 *   html={userContent} 
 *   config={{ ALLOWED_TAGS: ['p', 'br'] }}
 * />
 */
export function SafeHtml({
  html,
  allowRichText = false,
  config,
  className,
  as: Component = "div",
}: SafeHtmlProps) {
  const sanitized = React.useMemo(() => {
    if (allowRichText && !config) {
      return sanitizeRichText(html)
    }
    return sanitizeHtml(html, config)
  }, [html, allowRichText, config])

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

interface SafeTextProps {
  /**
   * The text content to render (will strip all HTML)
   */
  text: string

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * HTML element to render as
   * Default: "span"
   */
  as?: keyof JSX.IntrinsicElements
}

/**
 * SafeText Component
 * 
 * Renders text content with all HTML stripped.
 * Use this when you want to ensure no HTML is rendered at all.
 * 
 * Note: Regular React rendering already escapes HTML, so this is mainly
 * useful when you want to explicitly strip HTML tags from content.
 * 
 * @example
 * <SafeText text={userInput} />
 */
export function SafeText({
  text,
  className,
  as: Component = "span",
}: SafeTextProps) {
  const sanitized = React.useMemo(() => {
    return sanitizeHtml(text, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    })
  }, [text])

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * The URL to link to (will be sanitized)
   */
  href: string

  /**
   * Link text content
   */
  children: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * SafeLink Component
 * 
 * Renders a link with URL sanitization to prevent javascript: and data: URLs.
 * 
 * @example
 * <SafeLink href={userProvidedUrl}>Click here</SafeLink>
 */
export function SafeLink({
  href,
  children,
  className,
  ...props
}: SafeLinkProps) {
  const sanitizedHref = React.useMemo(() => {
    const trimmed = href?.trim() || ""

    // Block dangerous protocols
    const dangerousProtocols = /^(javascript|data|vbscript|file):/i
    if (dangerousProtocols.test(trimmed)) {
      return "#"
    }

    // Allow http, https, mailto, and relative URLs
    const safeProtocols = /^(https?:\/\/|mailto:|\/)/i
    if (!safeProtocols.test(trimmed)) {
      return `https://${trimmed}`
    }

    return trimmed
  }, [href])

  // Add security attributes for external links
  const isExternal = sanitizedHref.startsWith("http")
  const securityProps = isExternal
    ? {
        target: "_blank",
        rel: "noopener noreferrer",
      }
    : {}

  return (
    <a
      href={sanitizedHref}
      className={className}
      {...securityProps}
      {...props}
    >
      {children}
    </a>
  )
}

export default SafeHtml
