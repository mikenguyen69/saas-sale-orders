import { renderHook, act } from '@testing-library/react'

// Mock the dependencies with actual module paths
const mockGetAccessToken = jest.fn()
const mockSetGlobalLoading = jest.fn()
const mockShowError = jest.fn()
const mockShowSuccess = jest.fn()

// Mock the actual hook implementations
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}))

jest.mock('../../components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}))

jest.mock('../../components/providers/AppStateProvider', () => ({
  useAppStateContext: () => ({
    setLoading: mockSetGlobalLoading,
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  }),
}))

// Import after mocks
import { useApiCall } from '@/hooks/useApiCall'

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockGetAccessToken.mockReturnValue('valid-token')
  window.location.href = ''
})

describe('useApiCall - Critical Authentication Flow', () => {
  describe('Bearer token authentication errors', () => {
    it('should handle "Authorization header with Bearer token required" error without hanging', async () => {
      // Mock 401 response with the specific error message
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            message: 'Authorization header with Bearer token required',
          }),
      })

      const { result } = renderHook(() => useApiCall())

      let error: Error | null = null
      let completed = false

      const startTime = Date.now()
      await act(async () => {
        try {
          await result.current.callApi('/api/test')
        } catch (err) {
          error = err as Error
        } finally {
          completed = true
        }
      })
      const endTime = Date.now()

      // Critical: Should complete quickly without hanging (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      expect(completed).toBe(true)

      // Should redirect to login and not hang
      expect(window.location.href).toBe('/auth/login')
      expect(error).toBeInstanceOf(Error)
      expect((error as unknown as Error)?.message).toBe(
        'Authentication required. Redirecting to login...'
      )
    })

    it('should handle "Invalid or expired JWT token" error with proper cleanup', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            message: 'Invalid or expired JWT token',
          }),
      })

      const { result } = renderHook(() => useApiCall())

      let error: Error | null = null
      await act(async () => {
        try {
          await result.current.callApi('/api/test')
        } catch (err) {
          error = err as Error
        }
      })

      // Should call signout API and redirect
      expect(fetch).toHaveBeenCalledWith('/api/auth/signout', { method: 'POST' })
      expect(window.location.href).toBe('/auth/login')
      expect((error as unknown as Error)?.message).toBe(
        'Authentication required. Redirecting to login...'
      )
    })

    it('should handle request timeout without hanging', async () => {
      // Mock a hanging request that times out
      ;(fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const abortError = new Error('The operation was aborted')
              abortError.name = 'AbortError'
              reject(abortError)
            }, 100)
          })
      )

      const { result } = renderHook(() => useApiCall())

      let error: Error | null = null
      await act(async () => {
        try {
          await result.current.callApi('/api/test', {}, { timeoutMs: 50 })
        } catch (err) {
          error = err as Error
        }
      })

      expect((error as unknown as Error)?.message).toBe(
        'Request timed out. Please check your connection and try again.'
      )
      expect(mockShowError).toHaveBeenCalledWith(
        'Request timed out. Please check your connection and try again.'
      )
    })

    it('should clean up loading states after authentication error', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            message: 'Authorization header with Bearer token required',
          }),
      })

      const { result } = renderHook(() => useApiCall())

      await act(async () => {
        try {
          await result.current.callApi('/api/test')
        } catch (err) {
          // Expected error
        }
      })

      // Loading states should be cleaned up
      expect(result.current.isLoading).toBe(false)
      expect(mockSetGlobalLoading).toHaveBeenCalledWith(false)
    })

    it('should handle missing token scenario gracefully', async () => {
      mockGetAccessToken.mockReturnValue(null)
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            message: 'Authorization header with Bearer token required',
          }),
      })

      const { result } = renderHook(() => useApiCall())

      let error: Error | null = null
      await act(async () => {
        try {
          await result.current.callApi('/api/test')
        } catch (err) {
          error = err as Error
        }
      })

      // Should still handle the error properly even without token
      expect(window.location.href).toBe('/auth/login')
      expect((error as unknown as Error)?.message).toBe(
        'Authentication required. Redirecting to login...'
      )
    })
  })

  describe('Request timeout handling', () => {
    it('should abort request after timeout', async () => {
      const abortSpy = jest.fn()
      const mockController = {
        signal: { aborted: false },
        abort: abortSpy,
      }

      jest.spyOn(global, 'AbortController').mockImplementation(() => mockController as any)
      ;(fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useApiCall())

      act(() => {
        result.current.callApi('/api/test', {}, { timeoutMs: 100 })
      })

      // Wait for timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(abortSpy).toHaveBeenCalled()
    })
  })
})
