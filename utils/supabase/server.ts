import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

/**
 * Returns the root domain with a leading dot so session cookies are valid
 * across all subdomains (e.g. bhaavbhumi.X and mangalamcity.X share the same session).
 * Returns undefined on localhost / Vercel previews.
 */
function getRootDomain(hostname: string): string | undefined {
  // Strip port if present (e.g. localhost:3000)
  const host = hostname.split(':')[0];
  if (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.now.sh')
  ) return undefined;

  // e.g. bhaavbhumi.mahavirgroupindia.com → .mahavirgroupindia.com
  const parts = host.split('.');
  if (parts.length >= 3) {
    return '.' + parts.slice(-2).join('.');
  }
  return undefined;
}

export async function createClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const domain = getRootDomain(hostname)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // Spread existing options then override domain to root domain
              cookieStore.set(name, value, { ...options, ...(domain ? { domain } : {}) })
            )
          } catch {
            // Called from a Server Component — session refresh handled by middleware
          }
        },
      },
    }
  )
}
