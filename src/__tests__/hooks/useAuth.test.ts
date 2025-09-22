import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@supabase/ssr'

// Mock Supabase client
jest.mock('@supabase/ssr')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createBrowserClient as jest.Mock).mockReturnValue(mockSupabase)

  // Default mock for subscription
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
})

describe('useAuth - Session Expiry Handling', () => {
  it('should return null for expired session', () => {
    const expiredSession = {
      access_token: 'expired-token',
      expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    }

    const { result } = renderHook(() => useAuth())

    // Manually set the session to simulate expired state
    act(() => {
      // @ts-ignore - accessing private state for testing
      result.current.session = expiredSession
    })

    const token = result.current.getAccessToken()

    expect(token).toBeNull()
  })

  it('should return token for valid session', () => {
    const validSession = {
      access_token: 'valid-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
    }

    const { result } = renderHook(() => useAuth())

    // Manually set the session to simulate valid state
    act(() => {
      // @ts-ignore - accessing private state for testing
      result.current.session = validSession
    })

    const token = result.current.getAccessToken()

    expect(token).toBe('valid-token')
  })

  it('should handle session without expires_at', () => {
    const sessionWithoutExpiry = {
      access_token: 'token-without-expiry',
      // No expires_at field
    }

    const { result } = renderHook(() => useAuth())

    // Manually set the session
    act(() => {
      // @ts-ignore - accessing private state for testing
      result.current.session = sessionWithoutExpiry
    })

    const token = result.current.getAccessToken()

    expect(token).toBe('token-without-expiry')
  })

  it('should clear user and session when token is expired', () => {
    const expiredSession = {
      access_token: 'expired-token',
      expires_at: Math.floor(Date.now() / 1000) - 3600,
    }

    const { result } = renderHook(() => useAuth())

    // Set initial state with user and expired session
    act(() => {
      // @ts-ignore
      result.current.user = { id: 'user-123' }
      // @ts-ignore
      result.current.session = expiredSession
    })

    // Call getAccessToken which should clear the expired session
    act(() => {
      result.current.getAccessToken()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })
})