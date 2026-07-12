import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { headers } from 'next/headers'
import AdminDashboard from './AdminDashboard'
import LoginForm from './LoginForm'
import { logout } from './actions'

// ── Access Denied page (not a redirect — keeps them on page with clear message) ──
function AccessDenied({ userEmail }: { userEmail?: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
        <div style={{
          width: 64, height: 64, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 18, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>Access Denied</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 6, lineHeight: 1.6 }}>
          Your account <strong style={{ color: '#e2e8f0' }}>{userEmail}</strong> does not have permission to access this site&apos;s admin panel.
        </p>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 32 }}>
          Please contact your Super Admin to request access.
        </p>
        <form action={logout}>
          <button type="submit" style={{
            padding: '10px 24px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 600,
            cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif"
          }}>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LoginForm />
  }

  // ── Determine current site slug from subdomain ────────────────────────────
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isVercelUrl = hostname.endsWith('.vercel.app') || hostname.endsWith('.now.sh')

  let currentSiteSlug = ''
  if (!isLocalhost && !isVercelUrl) {
    const parts = hostname.split('.')
    if (parts.length >= 3 && parts[0] !== 'www') {
      currentSiteSlug = parts[0]
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Fetch all site_users rows for this user (one row per assigned site)
  const { data: siteUsers } = await supabaseAdmin
    .from('site_users')
    .select('role, sites(id, name, slug)')
    .eq('user_id', user.id)

  const isSuperAdmin = siteUsers?.some(su => su.role === 'super_admin')

  // Build list of sites this admin can access
  const accessibleSites = (siteUsers || [])
    .filter(su => su.role !== 'super_admin')
    .map(su => {
      const site = Array.isArray(su.sites) ? su.sites[0] : su.sites
      return {
        id: (site as any)?.id || '',
        name: (site as any)?.name || '',
        slug: (site as any)?.slug || ''
      }
    })
    .filter(s => s.slug !== '')

  // ── Site isolation check ─────────────────────────────────────────────────
  // Super admins bypass this check. Site admins must have the current subdomain in their list.
  // On localhost/Vercel preview URLs we skip the check (dev convenience).
  if (!isSuperAdmin && !isLocalhost && !isVercelUrl && currentSiteSlug) {
    const hasAccess = accessibleSites.some(s => s.slug === currentSiteSlug)
    if (!hasAccess) {
      return <AccessDenied userEmail={user.email} />
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return <AdminDashboard userEmail={user.email} accessibleSites={accessibleSites} />
}
