import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  let user = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Silently ignore errors (e.g. missing env variables) so the middleware doesn't crash
    console.error('Middleware Supabase Error:', error)
  }

  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Logic to determine site slug from subdomain or query param
  let siteSlug = url.searchParams.get('site')
  
  if (!siteSlug) {
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    
    if (!isLocalhost) {
      // Production: mangalamcity.mahavirgroup.com -> mangalamcity
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

  // 1. Auth protection for /hq routes
  if (url.pathname.startsWith('/hq')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    try {
      // We must use the service role key here to bypass RLS when checking roles
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {}, // No need to set cookies for admin read operations
          },
        }
      )

      const { data: siteUser } = await supabaseAdmin
        .from('site_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .single()

      if (!siteUser) {
        // Normal admins cannot access HQ
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    } catch (error) {
      console.error('Middleware Admin Check Error:', error)
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // 2. Auth protection for /admin routes
  if (url.pathname === '/admin/dashboard' || url.pathname.startsWith('/admin/sites')) {
      if (!user) {
          return NextResponse.redirect(new URL('/admin', request.url))
      }
  }

  // 3. Inject siteSlug into the headers so Server Components/API routes can read it
  supabaseResponse.headers.set('x-site-slug', siteSlug)

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
