# SaaS Sale Orders - Multi-Tenant Order Management Platform

## Project Overview

**SaaS Sale Orders** is a comprehensive multi-tenant B2B sales order management platform. The application provides complete order lifecycle management from creation to fulfillment with enterprise-grade security, role-based access control, real-time updates, and automated workflows.

## Multi-Tenancy Model

- **Pattern**: Shared application with tenant-isolated data via PostgreSQL Row Level Security
- **Isolation**: Tenant context validation in all database operations
- **Authentication**: Supabase Auth with tenant-scoped JWT tokens
- **Data**: Tenant-specific data isolation through Prisma with mandatory tenant filtering

## SaaS-Specific Guidelines

### Coding Standards

- TypeScript strict mode with comprehensive type safety
- All database queries MUST include tenant context validation
- API responses use consistent `Result<T, E>` pattern for error handling
- Comprehensive audit logging for all tenant operations
- Unit tests required for all business logic with tenant isolation tests

### Security Requirements

- Never expose tenant data across organizational boundaries
- Implement proper RBAC for admin and user functions
- Encrypt sensitive data at rest and in transit
- Regular security scanning and vulnerability assessments
- Compliance with SOC2, GDPR data protection requirements

### Performance Standards

- Monitor per-tenant resource usage and API performance
- Implement efficient caching strategies with tenant isolation
- Use connection pooling for database operations
- Implement rate limiting per tenant tier
- Horizontal scaling support for high-volume tenants

## Architecture & Technical Stack

### Core Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.6 (strict mode)
- **Database**: PostgreSQL via Supabase with Row Level Security
- **ORM**: Prisma 5.22 with tenant-aware queries
- **Authentication**: Supabase Auth with tenant context
- **State Management**: React Query (TanStack Query) + Context API
- **UI Framework**: Material-UI 5.16 + Tailwind CSS 3.4
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + Prettier + Husky

### SaaS Infrastructure

- **Multi-tenancy**: Row Level Security (RLS) policies
- **File Storage**: Supabase Storage with tenant isolation
- **Real-time**: Supabase Realtime with tenant filtering
- **API Documentation**: Swagger/OpenAPI with tenant-aware examples
- **Monitoring**: Per-tenant performance metrics
- **Security**: Automated vulnerability scanning

## Commands Reference

### Development Workflow

- `npm run dev`: Start development server with hot reload
- `npm run build`: Production build with Prisma generation
- `npm run start`: Production server
- `npm run test`: Comprehensive test suite including tenant isolation
- `npm run test:watch`: Watch mode for development testing
- `npm run test:coverage`: Generate test coverage report

### Database Operations

- `npm run db:start`: Start local Supabase instance
- `npm run db:stop`: Stop local Supabase instance
- `npm run db:reset`: Reset development database with seed data
- `npx prisma generate`: Generate Prisma client
- `npx prisma db push`: Push schema changes to database

### Code Quality

- `npm run lint`: ESLint with TypeScript strict mode
- `npm run lint:fix`: Auto-fix ESLint issues
- `npm run type-check`: TypeScript compilation check
- `npm run format`: Prettier code formatting
- `npm run format:check`: Check code formatting compliance

### Security & Audit

- `npm audit`: Check for security vulnerabilities
- Validate all API endpoints have proper tenant context
- Review database queries for tenant isolation
- Check RLS policies for data access controls

## Business Logic Patterns

### Tenant-Aware Data Access

```typescript
// ALWAYS use tenant context in database operations
const getOrdersForTenant = async (tenantId: string, userId: string) => {
  return prisma.saleOrder.findMany({
    where: {
      AND: [
        { salespersonId: userId },
        // Tenant context automatically enforced by RLS
      ],
    },
  })
}
```

### API Route Security

```typescript
// All API routes must validate tenant context
export async function GET(request: Request) {
  const { user, tenant } = await validateAuth(request)
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
  }
  // Proceed with tenant-aware operations
}
```

### Role-Based Access Control

```typescript
// Implement granular permissions per tenant
const hasPermission = (user: User, action: string, resource: string): boolean => {
  const userRole = user.role
  const permissions = getRolePermissions(userRole)
  return permissions.includes(`${action}:${resource}`)
}
```

## Order Workflow

### Multi-Status Process

1. **Draft Creation**: Salesperson creates order with product selection
2. **Stock Validation**: Real-time inventory checks with tenant isolation
3. **Submission**: Order submitted for manager approval within tenant
4. **Management Review**: Manager approves/rejects with audit trail
5. **Warehouse Processing**: Warehouse staff fulfills orders
6. **Completion**: Order marked as fulfilled with status history

### Tenant Isolation Points

- All queries filter by tenant context automatically via RLS
- File uploads stored in tenant-specific Storage buckets
- Real-time subscriptions scoped to tenant data
- Audit logs include tenant identification
- Error messages never leak cross-tenant information

## File Structure Navigation

### Core Directories

- `/src/app/api/v1/`: Tenant-aware API endpoint definitions
- `/src/components/`: Reusable UI components with tenant context
- `/src/lib/`: Utility libraries (Supabase, Prisma, Auth with tenant support)
- `/src/services/`: Business logic services with tenant validation
- `/src/types/`: TypeScript definitions including tenant types
- `/src/utils/`: Helper functions for tenant operations

### Critical Files

- `/src/lib/auth.ts`: Authentication with tenant context extraction
- `/src/lib/prisma.ts`: Database client with tenant-aware configurations
- `/src/middleware.ts`: Request middleware for tenant validation
- `/prisma/schema.prisma`: Database schema with RLS policies
- `/src/lib/rbac.ts`: Role-based access control implementation

## Anti-Patterns (DO NOT)

### Security Anti-Patterns

- Never query across tenant boundaries without explicit admin context
- Don't store tenant secrets in application code or environment variables
- Avoid shared caching without proper tenant isolation
- Never log sensitive tenant data in application logs
- Don't bypass tenant validation for "convenience" or testing

### Performance Anti-Patterns

- Don't implement N+1 queries in tenant operations
- Avoid synchronous operations that could block other tenants
- Don't use shared rate limiting across tenants
- Never implement database queries without proper indexing
- Avoid loading unnecessary data across tenant boundaries

### Architecture Anti-Patterns

- Don't hardcode tenant-specific logic in shared components
- Avoid tight coupling between tenant management and business logic
- Don't implement custom authentication without security review
- Never bypass Row Level Security policies
- Don't create tenant-specific API endpoints (use tenant context instead)

## Compliance & Security Notes

- All tenant data encrypted at rest via Supabase encryption
- Audit logging implemented for all tenant data access
- Regular security scanning via GitHub Actions
- GDPR compliance for data deletion and export
- SOC2 compliance requirements for enterprise customers
- Row Level Security policies enforce tenant isolation at database level

## Scaling Considerations

- Supabase handles database scaling automatically
- Connection pooling via Prisma for efficient resource usage
- CDN integration via Vercel for global performance
- Real-time subscriptions scale per tenant automatically
- File storage partitioned by tenant for optimal performance

## Development Workflow

1. Create feature branch from main
2. Implement with tenant isolation in mind
3. Write comprehensive tests including tenant boundary tests
4. Run security checks and tenant isolation validation
5. Create pull request with security review checklist
6. Deploy via CI/CD pipeline with automated testing

## Documentation References

- **Database Schema**: `/prisma/schema.prisma` - Complete data model
- **API Documentation**: Auto-generated Swagger at `/api/docs`
- **Authentication Flow**: `/src/lib/auth.ts` - Tenant-aware auth
- **Role Permissions**: `/src/lib/rbac.ts` - RBAC implementation
- **Multi-tenancy Guide**: This file - Comprehensive tenant patterns

## MCP Integration

- **JIRA Connectivity**: Automated ticket management via MCP server
- **Project Tracking**: CCS project integration for development workflow
- **Security Reviews**: Automated security validation in Claude Code
- **Code Quality**: Real-time code review with tenant security focus

---

**Development Priority**: Tenant isolation and security are non-negotiable. All features must be implemented with multi-tenant architecture from the ground up. Performance and user experience should never compromise tenant data security.
