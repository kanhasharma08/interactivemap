'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // signInWithPassword already returns the user — no need for a separate getUser() call
  const { data: signInData, error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    return { error: error.message }
  }

  const userId = signInData.user?.id
  if (userId) {
    // Use service-role admin client so RLS doesn't block the lookup
    const { data: siteUser } = await supabaseAdmin
      .from('site_users')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .single()

    if (siteUser) {
      redirect('/hq')
    }
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin')
}
