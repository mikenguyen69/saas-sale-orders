import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: unknown
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
    public details?: unknown
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

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  let { data: userDetails, error: dbUserError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null) // Ensure user is not soft-deleted
    .single()

  // If user doesn't exist in our users table, create them automatically
  if (dbUserError && dbUserError.code === 'PGRST116') {
    // Extract name from user metadata or email
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'

    console.log('Creating user profile for:', {
      id: user.id,
      email: user.email,
      name,
      metadata: user.user_metadata,
    })

    // Auto-create user with default role
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        name,
        role: 'salesperson', // Default role
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user profile:', {
        error: createError,
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
      })

      // Check if it's a unique constraint violation (user already exists)
      if (createError.code === '23505') {
        console.log('User already exists, trying to fetch again...')
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .is('deleted_at', null)
          .single()

        if (fetchError) {
          console.error('Failed to fetch existing user:', fetchError)
          throw new ApiError(500, 'User exists but cannot be retrieved')
        }

        userDetails = existingUser
      } else {
        throw new ApiError(500, `Failed to create user profile: ${createError.message}`)
      }
    } else {
      userDetails = newUser
    }
  } else if (dbUserError || !userDetails) {
    console.error('Database user error:', {
      error: dbUserError,
      code: dbUserError?.code,
      message: dbUserError?.message,
      userId: user.id,
      userEmail: user.email,
    })
    throw new ApiError(404, 'User not found in database or account is deactivated')
  }

  return { user, userDetails, supabase }
}

export function requireRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(', ')}`)
  }
}

export async function withAuth<T extends unknown[]>(
  request: NextRequest,
  handler: (
    request: NextRequest,
    context: {
      user: NonNullable<unknown>
      userDetails: NonNullable<unknown>
      supabase: NonNullable<unknown>
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
