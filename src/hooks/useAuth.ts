'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  getAccessToken: () => string | null
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Secure authentication check on mount
    const checkAuth = async () => {
      try {
        setLoading(true)

        // Add timeout to prevent hanging auth checks
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 10000)
        )

        // Always use getUser() for secure authentication verification
        const {
          data: { user },
          error,
        } = (await Promise.race([authPromise, timeoutPromise])) as {
          data: { user: User | null }
          error: { message: string; status?: number } | null
        }

        if (error) {
          console.warn('Auth check failed:', error.message)
          // Handle specific authentication errors
          if (
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.status === 401
          ) {
            console.warn('Session expired or invalid, clearing auth state')
            await supabase.auth.signOut({ scope: 'local' })
          }
          setUser(null)
          setSession(null)
        } else if (!user) {
          console.warn('No user found, clearing auth state')
          setUser(null)
          setSession(null)
        } else {
          setUser(user)
          // Get the current session after user verification
          const {
            data: { session },
          } = await supabase.auth.getSession()
          setSession(session)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // Handle timeout or network errors
        if (error instanceof Error && error.message === 'Auth check timeout') {
          console.warn('Authentication check timed out, proceeding as unauthenticated')
        }
        setUser(null)
        setSession(null)
        // Ensure we clear any bad auth state
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (signOutError) {
          console.warn('Failed to clear auth state:', signOutError)
        }
      } finally {
        // CRITICAL: Always clear loading state
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes with secure verification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Always verify user authenticity on auth events
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser()
          if (!error && user) {
            setUser(user)
            setSession(session)
          } else {
            console.warn('Auth verification failed on', event, error?.message)
            setUser(null)
            setSession(null)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
        setSession(null)
      } finally {
        // CRITICAL: Always clear loading state on auth events
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      // Verify the user after sign in
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        return { error: 'Failed to verify user authentication' }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAccessToken = () => {
    // Check if session is expired
    if (session && session.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      if (now >= session.expires_at) {
        console.warn('Session expired, clearing auth state and triggering re-auth')
        setUser(null)
        setSession(null)
        // Trigger a re-auth check
        supabase.auth
          .signOut({ scope: 'local' })
          .catch(err => console.warn('Failed to clear expired session:', err))
        return null
      }
    }
    return session?.access_token || null
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getAccessToken,
  }
}
