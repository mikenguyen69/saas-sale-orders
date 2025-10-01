import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Test database connection and provide helpful error messages
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'

    // Check for common connection issues
    if (errorMessage.includes("Can't reach database server")) {
      return {
        success: false,
        error:
          'Database server is unreachable. Please ensure your database is running. For local development, start Supabase with: npm run db:start',
      }
    }

    if (errorMessage.includes('authentication failed')) {
      return {
        success: false,
        error:
          'Database authentication failed. Please check your DATABASE_URL credentials in .env.local',
      }
    }

    return {
      success: false,
      error: `Database connection failed: ${errorMessage}`,
    }
  }
}

/**
 * Gracefully handle database operations with connection error handling
 */
export async function withDatabaseErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check if it's a connection error
    if (errorMessage.includes("Can't reach database server")) {
      throw new Error(
        'Database is currently unavailable. Please ensure the database server is running. For local development, start Supabase with: npm run db:start'
      )
    }

    // Re-throw the original error if it's not a connection issue
    throw error
  }
}
