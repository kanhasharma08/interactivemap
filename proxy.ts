import { NextResponse, type NextRequest } from 'next/server'
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Logic to determine site slug from subdomain or query param
  let siteSlug = url.searchParams.get('site')
  
  if (!siteSlug) {
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    
    if (!isLocalhost) {
      // Production: mangalamcity.mahavirgroup.com -> mangalamcity
      // For Vercel preview URLs (like xxx.vercel.app), this will extract the xxx part
      const parts = hostname.split('.')
      if (parts.length >= 3 && parts[0] !== 'www') {
        siteSlug = parts[0]
      }
    }
  }

  // If no site slug found (e.g. visiting mahavirgroup.com directly), default to mangalamcity for now
  if (!siteSlug) {
    siteSlug = 'mangalamcity'
  }

  // Inject siteSlug into the headers so Server Components/API routes can read it
  response.headers.set('x-site-slug', siteSlug)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
