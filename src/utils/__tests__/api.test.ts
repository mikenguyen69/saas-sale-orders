import { apiRequest, ApiError, isApiError } from '../api'

// Mock fetch
global.fetch = jest.fn()

describe('apiRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should make successful GET request', async () => {
    const mockData = { id: 1, name: 'Test' }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    })

    const result = await apiRequest({
      url: '/api/test',
      method: 'GET',
    })

    expect(result).toEqual(mockData)
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: undefined,
    })
  })

  it('should make successful POST request with data', async () => {
    const mockData = { id: 1, name: 'Test' }
    const requestData = { name: 'Test' }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    })

    const result = await apiRequest({
      url: '/api/test',
      method: 'POST',
      data: requestData,
    })

    expect(result).toEqual(mockData)
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: undefined,
    })
  })

  it('should handle API validation errors', async () => {
    const mockErrors = { email: ['Email is required'] }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'Validation failed', errors: mockErrors }),
    })

    try {
      await apiRequest({
        url: '/api/test',
        method: 'POST',
        data: {},
      })
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).errors).toEqual(mockErrors)
      expect((error as ApiError).status).toBe(400)
      expect((error as ApiError).message).toBe('Validation failed')
    }
  })

  it('should handle HTTP errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Internal server error' }),
    })

    await expect(
      apiRequest({
        url: '/api/test',
        method: 'GET',
      })
    ).rejects.toThrow('Internal server error')
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    await expect(
      apiRequest({
        url: '/api/test',
        method: 'GET',
      })
    ).rejects.toThrow('Network error')
  })

  it('should handle abort signals', async () => {
    const controller = new AbortController()
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(abortError)

    await expect(
      apiRequest({
        url: '/api/test',
        method: 'GET',
        signal: controller.signal,
      })
    ).rejects.toThrow('The operation was aborted.')
  })

  it('should handle missing data in response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await expect(
      apiRequest({
        url: '/api/test',
        method: 'GET',
      })
    ).rejects.toThrow('Missing data in API response')
  })
})

describe('isApiError', () => {
  it('should correctly identify ApiError instances', () => {
    const apiError = new ApiError('Test error', 400)
    const regularError = new Error('Regular error')

    expect(isApiError(apiError)).toBe(true)
    expect(isApiError(regularError)).toBe(false)
    expect(isApiError('string')).toBe(false)
    expect(isApiError(null)).toBe(false)
  })
})

describe('ApiError', () => {
  it('should create ApiError with all properties', () => {
    const errors = { field: ['Error message'] }
    const error = new ApiError('Test message', 400, errors)

    expect(error.message).toBe('Test message')
    expect(error.status).toBe(400)
    expect(error.errors).toEqual(errors)
    expect(error.name).toBe('ApiError')
    expect(error).toBeInstanceOf(Error)
  })
})
