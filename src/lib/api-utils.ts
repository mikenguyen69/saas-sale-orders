import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

export type PaginatedResponse<T> = {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createErrorResponse(
  error: unknown,
  defaultMessage = 'Internal server error'
): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: 'api_error',
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'validation_error',
        message: 'Validation failed',
        details: {
          issues: error.issues.map(issue => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
          })),
        },
      },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: error.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: 'unknown_error',
      message: defaultMessage,
    },
    { status: 500 }
  )
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  )
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

export async function validateRequest<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json()
  return schema.parse(body)
}

export async function validateQuery<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  return schema.parse(params)
}

export async function getAuthenticatedUser(request: NextRequest) {
  // Extract JWT token from Authorization header
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization header with Bearer token required')
  }

  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    throw new ApiError(401, 'JWT token required')
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for API routes
        },
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  // Use getUser() with the token directly for secure authentication verification
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    console.error('Authentication error:', userError?.message)
    throw new ApiError(401, 'Invalid or expired JWT token')
  }

  // Get user details from database with additional verification
  const { data: userDetails, error: dbUserError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null) // Ensure user is not soft-deleted
    .single()

  if (dbUserError || !userDetails) {
    throw new ApiError(404, 'User not found in database or account is deactivated')
  }

  return { user, userDetails, supabase }
}

export function requireRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(', ')}`)
  }
}

export async function withAuth<T extends any[]>(
  request: NextRequest,
  handler: (
    request: NextRequest,
    context: {
      user: any
      userDetails: any
      supabase: any
    },
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (...args: T) => {
    try {
      const authContext = await getAuthenticatedUser(request)
      return await handler(request, authContext, ...args)
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}
