export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

export interface ApiRequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  signal?: AbortSignal
  headers?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T = any>(config: ApiRequestConfig): Promise<T> {
  const { url, method, data, signal, headers = {} } = config

  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
  }

  if (data && method !== 'GET') {
    requestConfig.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, requestConfig)
    const result: ApiResponse<T> = await response.json()

    if (!response.ok) {
      throw new ApiError(
        result.error || `HTTP error! status: ${response.status}`,
        response.status,
        result.errors
      )
    }

    if (!result.success) {
      throw new ApiError(result.error || 'Request failed', response.status, result.errors)
    }

    if (result.data === undefined) {
      throw new ApiError('Missing data in API response', response.status)
    }

    return result.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(error instanceof Error ? error.message : 'Unknown error occurred', 0)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
