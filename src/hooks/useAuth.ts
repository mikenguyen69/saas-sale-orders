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

        // Always use getUser() for secure authentication verification
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
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
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes with secure verification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

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
          setUser(null)
          setSession(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
      }

      setLoading(false)
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
        console.warn('Session expired, clearing auth state')
        setUser(null)
        setSession(null)
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
