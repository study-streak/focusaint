import { NextRequest, NextResponse } from 'next/server'
import { extractYouTubeVideoId, recoverUrlFromSegments } from '@/lib/quick-mode'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  // Skip middleware for api, assets, and already-canonical routes
  if (pathname === '/' || pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/study') || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    return NextResponse.next()
  }

  // Extract segments after initial /
  const segments = pathname.split('/').filter(Boolean)

  // Only attempt YouTube URL recovery if path looks like a potential URL (starts with http or domain-like)
  if (segments.length > 0 && (segments[0].includes('.') || segments[0].toLowerCase().startsWith('http'))) {
    let recoveredUrl = recoverUrlFromSegments(segments)
    
    // Append original query params if they exist
    if (search) {
      recoveredUrl += search
    }

    // If it's a valid YouTube URL, redirect to /study?url=...
    if (extractYouTubeVideoId(recoveredUrl)) {
      const newUrl = new URL(request.nextUrl)
      newUrl.pathname = '/study'
      newUrl.search = `url=${encodeURIComponent(recoveredUrl)}`
      return NextResponse.redirect(newUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
