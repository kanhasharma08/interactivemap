import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import AdminDashboard from './AdminDashboard'
import LoginForm from './LoginForm'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LoginForm />
  }

  // Fetch which sites this admin can access
  const { data: siteUsers } = await supabaseAdmin
    .from('site_users')
    .select('role, sites(id, name, slug)')
    .eq('user_id', user.id);

  // If super_admin, they can theoretically access all, but they should be in HQ anyway
  const accessibleSites = siteUsers?.map(su => ({
    id: su.sites?.id || 'all',
    name: su.sites?.name || 'All Sites',
    slug: su.sites?.slug || ''
  })) || [];

  return <AdminDashboard userEmail={user.email} accessibleSites={accessibleSites} />
}
