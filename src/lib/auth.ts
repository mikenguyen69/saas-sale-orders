import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { UserRole } from '@/types'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
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
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export function createRouteHandlerSupabaseClient() {
  return createServerSupabaseClient()
}

export async function getCurrentUser(): Promise<
  Database['public']['Tables']['users']['Row'] | null
> {
  const supabase = createServerSupabaseClient()

  try {
    // Use secure getUser() method instead of getSession()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const { data: userDetails } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return userDetails
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]) {
  return requiredRoles.includes(userRole)
}

export const ROLE_PERMISSIONS = {
  salesperson: ['create_order', 'edit_own_draft', 'submit_order'],
  manager: ['approve_order', 'reject_order', 'view_all_orders'],
  warehouse: ['update_fulfillment', 'add_notes', 'upload_attachments'],
} as const
