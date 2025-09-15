import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  // Check if required environment variables are present
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      'Supabase environment variables not configured. Skipping authentication middleware.'
    )
    return NextResponse.next()
  }

  let res: NextResponse

  try {
    res = NextResponse.next()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                if (res && !res.headers.get('location')) {
                  res.cookies.set(name, value, options)
                }
              })
            } catch (error) {
              console.warn('Failed to set cookies:', error)
            }
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not authenticated and trying to access protected routes
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // If user is authenticated and trying to access auth pages
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Role-based access control for API routes
    if (req.nextUrl.pathname.startsWith('/api/') && session) {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (user && user.role) {
          // Only set headers if response hasn't been sent
          if (!res.headers.get('location')) {
            res.headers.set('x-user-role', (user as { role: string }).role)
            res.headers.set('x-user-id', session.user.id)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user role:', error)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
