import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // We must create a new response on every call so cookies can be mutated
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Apply cookies to the incoming request first
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Then create a fresh response with the updated request
          supabaseResponse = NextResponse.next({ request });
          // And stamp the cookies onto the response too
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() is what actually refreshes the session.
  // Do NOT add logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /hq — only super admins should reach it; redirect anyone
  // who is not logged in back to /admin for login.
  if (!user && request.nextUrl.pathname.startsWith('/hq')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    return NextResponse.redirect(redirectUrl);
  }

  // --- Subdomain routing ---
  // If a user hits the root path (/) on the "maps" subdomain,
  // rewrite to the /maps landing page instead of serving the main app.
  const hostname = request.headers.get('host') || '';
  if (hostname.startsWith('maps.') && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/maps', request.url));
  }

  // IMPORTANT: return supabaseResponse unchanged so cookies are forwarded.
  // Returning a plain NextResponse.next() here would lose session cookies.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - common image/font extensions
     * API routes are intentionally included so session cookies are refreshed there too.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
