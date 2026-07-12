import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns the root domain with a leading dot so the session cookie is valid
 * across ALL subdomains (e.g. bhaavbhumi.X and mangalamcity.X share the same session).
 * Returns undefined on localhost/Vercel previews so those environments aren't affected.
 */
function getRootDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  if (
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.now.sh')
  ) return undefined;

  // e.g. bhaavbhumi.mahavirgroupindia.com → .mahavirgroupindia.com
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return '.' + parts.slice(-2).join('.');
  }
  return undefined;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: getRootDomain(),
      },
    }
  )
}
