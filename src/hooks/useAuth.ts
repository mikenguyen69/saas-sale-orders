'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
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

  const supabase = createClient()

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
          // Only clear auth state for actual authentication errors, not network issues
          if (
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.message.includes('invalid') ||
            error.status === 401 ||
            error.status === 403
          ) {
            console.warn('Session expired or invalid, clearing auth state')
            // Only call signOut for actual auth failures, not network errors
            setUser(null)
            setSession(null)
            // Don't call signOut here as it can trigger unwanted auth events
            // Just clear the local state
          } else {
            // For network errors or other issues, try to preserve existing session
            console.warn(
              'Network or temporary error during auth check, preserving existing session if valid'
            )
            const {
              data: { session },
            } = await supabase.auth.getSession()
            if (session && session.access_token) {
              // Check if the existing session is still valid
              const now = Math.floor(Date.now() / 1000)
              if (!session.expires_at || now < session.expires_at) {
                console.log('Preserving valid existing session')
                setSession(session)
                // Don't set user yet, wait for successful verification
                return
              }
            }
            // If no valid session exists, clear the state
            setUser(null)
            setSession(null)
          }
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
        // Handle timeout or network errors - try to preserve valid sessions
        if (error instanceof Error && error.message === 'Auth check timeout') {
          console.warn('Authentication check timed out, checking for existing valid session')
        }

        // Try to preserve existing session if it's still valid
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session && session.access_token) {
            const now = Math.floor(Date.now() / 1000)
            if (!session.expires_at || now < session.expires_at) {
              console.log('Preserving valid session after auth check error')
              setSession(session)
              // Try to get user info if we have a valid session - with timeout protection
              try {
                const userPromise = supabase.auth.getUser()
                const userTimeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('User verification timeout')), 5000)
                )

                const {
                  data: { user },
                } = (await Promise.race([userPromise, userTimeoutPromise])) as {
                  data: { user: User | null }
                  error: { message: string; status?: number } | null
                }

                if (user) {
                  setUser(user)
                  return // Successfully preserved session and user
                }
              } catch (userError) {
                console.warn(
                  'Could not verify user with preserved session (timeout or error):',
                  userError
                )
                // Don't clear the session, just proceed without user verification
                // The session is still valid, user verification just failed
              }
            }
          }
        } catch (sessionError) {
          console.warn('Could not check existing session:', sessionError)
        }

        // Only clear auth state if we couldn't preserve a valid session
        setUser(null)
        setSession(null)
        // Don't call signOut here - it can cause unwanted auth state changes
        // during network errors or timeouts. Let the session expire naturally.
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
          // Always verify user authenticity on auth events - with timeout protection
          try {
            const authPromise = supabase.auth.getUser()
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Auth event verification timeout')), 5000)
            )

            const {
              data: { user },
              error,
            } = (await Promise.race([authPromise, timeoutPromise])) as {
              data: { user: User | null }
              error: { message: string; status?: number } | null
            }

            if (!error && user) {
              setUser(user)
              setSession(session)
            } else {
              console.warn('Auth verification failed on', event, error?.message)
              // Only clear auth state if this is an actual auth failure, not network issue
              if (
                error &&
                (error.status === 401 ||
                  error.status === 403 ||
                  error.message.includes('Invalid JWT'))
              ) {
                setUser(null)
                setSession(null)
              } else {
                // For network errors, preserve the session if it was provided
                if (session && session.access_token) {
                  console.log('Preserving session despite verification error')
                  setSession(session)
                }
              }
            }
          } catch (verificationError) {
            console.warn('Auth event verification timeout/error:', verificationError)
            // On timeout, preserve the session if it was provided and looks valid
            if (session && session.access_token) {
              const now = Math.floor(Date.now() / 1000)
              if (!session.expires_at || now < session.expires_at) {
                console.log('Preserving valid session after verification timeout')
                setSession(session)
                // Don't set user since we couldn't verify, but keep the session
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        // Don't automatically clear auth state on network errors during auth events
        // Only clear if we know it's an auth failure
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        } else {
          console.warn('Preserving auth state due to network error during auth event')
        }
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
        console.warn('Session expired, clearing auth state')
        setUser(null)
        setSession(null)
        // Don't call signOut here - just clear local state
        // The expired session will be handled naturally by Supabase
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
