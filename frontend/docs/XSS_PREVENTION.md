# XSS Prevention Guide

## Overview

This document outlines XSS (Cross-Site Scripting) prevention strategies implemented in the focusaint frontend application.

## React's Built-in Protection

React provides automatic XSS protection through:

### 1. Automatic Escaping

React automatically escapes all values rendered in JSX:

```tsx
// ✅ SAFE: React automatically escapes HTML
const userInput = '<script>alert("XSS")</script>'
return <div>{userInput}</div>
// Renders as: &lt;script&gt;alert("XSS")&lt;/script&gt;
```

### 2. Attribute Escaping

React escapes attribute values:

```tsx
// ✅ SAFE: React escapes the title attribute
const userTitle = 'Hello" onload="alert(\'XSS\')'
return <div title={userTitle}>Content</div>
```

## When Additional Protection is Needed

### Dangerous Patterns

React's protection doesn't cover:

1. **dangerouslySetInnerHTML**
   ```tsx
   // ❌ DANGEROUS: No sanitization
   <div dangerouslySetInnerHTML={{ __html: userInput }} />
   ```

2. **Direct DOM Manipulation**
   ```tsx
   // ❌ DANGEROUS: Bypasses React
   useEffect(() => {
     document.getElementById('content').innerHTML = userInput
   }, [])
   ```

3. **Unsafe URLs**
   ```tsx
   // ❌ DANGEROUS: javascript: URLs
   <a href={userProvidedUrl}>Click</a>
   ```

## Sanitization Utilities

### File: `frontend/lib/sanitize.ts`

#### Basic Text Sanitization

```tsx
import { sanitizeText } from '@/lib/sanitize'

// Strip all HTML tags
const clean = sanitizeText(userInput)
return <div>{clean}</div>
```

#### Rich Text Sanitization

```tsx
import { sanitizeRichText, createSafeRichText } from '@/lib/sanitize'

// Allow safe HTML tags (bold, italic, links, etc.)
const safeHtml = sanitizeRichText(userInput)
return <div dangerouslySetInnerHTML={createSafeRichText(userInput)} />
```

#### URL Sanitization

```tsx
import { sanitizeUrl, isSafeUrl } from '@/lib/sanitize'

// Sanitize and validate URLs
const safeUrl = sanitizeUrl(userProvidedUrl)
if (safeUrl) {
  return <a href={safeUrl}>Link</a>
}
```

## Safe Components

### File: `frontend/components/ui/safe-html.tsx`

#### SafeHtml Component

For rendering user-generated HTML:

```tsx
import { SafeHtml } from '@/components/ui/safe-html'

// Plain text (strips all HTML)
<SafeHtml html={userContent} />

// Rich text (allows safe formatting)
<SafeHtml html={userContent} allowRichText />

// Custom configuration
<SafeHtml 
  html={userContent}
  config={{ ALLOWED_TAGS: ['p', 'br', 'strong'] }}
/>
```

#### SafeText Component

For explicitly stripping HTML:

```tsx
import { SafeText } from '@/components/ui/safe-html'

<SafeText text={userInput} />
```

#### SafeLink Component

For safe external links:

```tsx
import { SafeLink } from '@/components/ui/safe-html'

<SafeLink href={userProvidedUrl}>
  Click here
</SafeLink>
```

## Usage Guidelines

### ✅ DO

1. **Use React's automatic escaping by default**
   ```tsx
   <div>{userInput}</div>
   ```

2. **Sanitize before using dangerouslySetInnerHTML**
   ```tsx
   import { createSafeHtml } from '@/lib/sanitize'
   <div dangerouslySetInnerHTML={createSafeHtml(userInput)} />
   ```

3. **Use SafeHtml component for user content**
   ```tsx
   <SafeHtml html={userContent} allowRichText />
   ```

4. **Validate and sanitize URLs**
   ```tsx
   import { sanitizeUrl } from '@/lib/sanitize'
   const href = sanitizeUrl(userUrl) || '#'
   <a href={href}>Link</a>
   ```

5. **Use SafeLink for external links**
   ```tsx
   <SafeLink href={userUrl}>External Link</SafeLink>
   ```

### ❌ DON'T

1. **Never use dangerouslySetInnerHTML without sanitization**
   ```tsx
   // ❌ DANGEROUS
   <div dangerouslySetInnerHTML={{ __html: userInput }} />
   ```

2. **Never trust user-provided URLs**
   ```tsx
   // ❌ DANGEROUS: Could be javascript:alert('XSS')
   <a href={userUrl}>Link</a>
   ```

3. **Never use eval() or Function() with user input**
   ```tsx
   // ❌ DANGEROUS
   eval(userInput)
   new Function(userInput)()
   ```

4. **Never set innerHTML directly**
   ```tsx
   // ❌ DANGEROUS
   element.innerHTML = userInput
   ```

## Common Scenarios

### 1. Displaying User Names

```tsx
// ✅ SAFE: React automatically escapes
function UserProfile({ user }) {
  return <h1>{user.name}</h1>
}
```

### 2. Displaying User Descriptions

```tsx
// ✅ SAFE: Using SafeHtml component
import { SafeHtml } from '@/components/ui/safe-html'

function UserBio({ bio }) {
  return <SafeHtml html={bio} allowRichText />
}
```

### 3. Rendering Task Notes

```tsx
// ✅ SAFE: Sanitized rich text
import { SafeHtml } from '@/components/ui/safe-html'

function TaskNotes({ notes }) {
  return (
    <div className="notes">
      <SafeHtml html={notes} allowRichText />
    </div>
  )
}
```

### 4. External Links from User Input

```tsx
// ✅ SAFE: Using SafeLink component
import { SafeLink } from '@/components/ui/safe-html'

function AttachmentLink({ url, name }) {
  return <SafeLink href={url}>{name}</SafeLink>
}
```

### 5. YouTube Video Embeds

```tsx
// ✅ SAFE: Validate YouTube URL format
function VideoEmbed({ url }) {
  const videoId = extractYouTubeId(url)
  
  if (!videoId) {
    return <div>Invalid video URL</div>
  }
  
  // Use iframe with validated video ID
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title="Video"
      allowFullScreen
    />
  )
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match?.[1] || null
}
```

### 6. Displaying API Responses

```tsx
// ✅ SAFE: Sanitize entire object
import { sanitizeObject } from '@/lib/sanitize'

function useApiData(endpoint: string) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        // Sanitize all string fields in response
        const sanitized = sanitizeObject(data)
        setData(sanitized)
      })
  }, [endpoint])
  
  return data
}
```

## Content Security Policy (CSP)

### Recommended CSP Headers

Add these headers in Next.js middleware or server configuration:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.youtube.com",
      "frame-src 'self' https://www.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  )
  
  return response
}
```

## Testing for XSS Vulnerabilities

### Manual Testing

Test with these payloads:

```javascript
// Basic XSS
<script>alert('XSS')</script>

// Event handler
<img src=x onerror=alert('XSS')>

// JavaScript URL
javascript:alert('XSS')

// Data URL
data:text/html,<script>alert('XSS')</script>

// SVG XSS
<svg onload=alert('XSS')>

// HTML entities
&lt;script&gt;alert('XSS')&lt;/script&gt;
```

### Automated Testing

```typescript
// __tests__/xss-prevention.test.tsx
import { sanitizeHtml, sanitizeUrl } from '@/lib/sanitize'

describe('XSS Prevention', () => {
  it('should strip script tags', () => {
    const input = '<script>alert("XSS")</script>Hello'
    const output = sanitizeHtml(input)
    expect(output).toBe('Hello')
    expect(output).not.toContain('<script>')
  })
  
  it('should block javascript: URLs', () => {
    const input = 'javascript:alert("XSS")'
    const output = sanitizeUrl(input)
    expect(output).toBeNull()
  })
  
  it('should block data: URLs', () => {
    const input = 'data:text/html,<script>alert("XSS")</script>'
    const output = sanitizeUrl(input)
    expect(output).toBeNull()
  })
  
  it('should allow safe URLs', () => {
    const input = 'https://example.com'
    const output = sanitizeUrl(input)
    expect(output).toBe('https://example.com')
  })
})
```

## Security Checklist

- [ ] All user input is rendered using React's automatic escaping
- [ ] dangerouslySetInnerHTML is only used with sanitized content
- [ ] All URLs from user input are validated and sanitized
- [ ] External links have rel="noopener noreferrer"
- [ ] No eval() or Function() with user input
- [ ] No direct innerHTML manipulation
- [ ] Content Security Policy headers are configured
- [ ] XSS prevention is tested with common payloads

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://react.dev/learn/writing-markup-with-jsx#the-rules-of-jsx)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
