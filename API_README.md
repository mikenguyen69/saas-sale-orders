# Sales Order Management API

## Overview

The Sales Order Management API provides a comprehensive RESTful interface for managing users, products, and sales orders with role-based access control.

## API Documentation

Interactive API documentation is available at: `/api/docs`

## Authentication

All API endpoints require JWT authentication via Supabase. Include the bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### User Management

| Method | Endpoint             | Description                | Required Role          |
| ------ | -------------------- | -------------------------- | ---------------------- |
| GET    | `/api/v1/users`      | List all users (paginated) | Manager                |
| POST   | `/api/v1/users`      | Create a new user          | Manager                |
| GET    | `/api/v1/users/{id}` | Get user by ID             | Own profile or Manager |
| PUT    | `/api/v1/users/{id}` | Update user                | Own profile or Manager |
| DELETE | `/api/v1/users/{id}` | Soft delete user           | Manager                |

### Query Parameters for GET /api/v1/users

- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `role` (string, optional): Filter by role (`salesperson`, `manager`, `warehouse`)
- `search` (string, optional): Search by name or email
- `includeDeleted` (boolean, default: false): Include soft-deleted users

## User Roles

1. **Salesperson**: Can manage their own orders and view products
2. **Manager**: Can manage users, approve/reject orders, and manage products
3. **Warehouse**: Can fulfill orders and manage inventory

## Data Models

### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "salesperson|manager|warehouse",
  "name": "Full Name",
  "createdAt": "2024-01-01T00:00:00Z",
  "deletedAt": null
}
```

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "issues": [
      {
        "path": ["email"],
        "message": "Invalid email address",
        "code": "invalid_string"
      }
    ]
  }
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "error": "api_error",
  "message": "Authentication required"
}
```

### Authorization Error (403)

```json
{
  "success": false,
  "error": "api_error",
  "message": "Access denied. Required roles: manager"
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "error": "api_error",
  "message": "User not found"
}
```

## Success Responses

### Single Resource

```json
{
  "success": true,
  "data": {
    /* resource object */
  },
  "message": "Optional success message"
}
```

### Paginated List

```json
{
  "success": true,
  "data": [
    /* array of resources */
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Testing

Run the API validation tests:

```bash
npm test -- --testPathPattern=validation.test.ts
```

## Development

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Start local Supabase:

   ```bash
   npm run db:start
   ```

3. View API documentation:
   ```
   http://localhost:3000/api/docs
   ```

## Quality Standards

- ✅ **Type Safety**: Full TypeScript coverage with Zod validation
- ✅ **Authentication**: JWT-based with Supabase integration
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **Error Handling**: Comprehensive error responses with proper HTTP status codes
- ✅ **Validation**: Request/response validation with detailed error messages
- ✅ **Documentation**: OpenAPI 3.0 specification with Swagger UI
- ✅ **Testing**: Unit tests for validation logic
- ✅ **Database**: Soft deletes and audit trails
- ✅ **Pagination**: Efficient pagination for large datasets
- ✅ **Security**: Row Level Security (RLS) at database level

## Implementation Status

### Phase 3: API Development ✅ COMPLETED

#### User Management (1 day) ✅

- ✅ `/api/v1/users` CRUD endpoints
- ✅ Role-based access control
- ✅ Input validation with Zod
- ✅ Comprehensive error handling
- ✅ Swagger documentation
- ✅ Unit tests

#### Next: Product Management (1 day)

- `/api/v1/products` endpoints
- Stock management integration
- Category filtering

#### Next: Order Management (2 days)

- `/api/v1/orders` endpoints
- Workflow state management
- Line item handling

#### Next: Workflow Actions (2 days)

- Order submission/approval/fulfillment endpoints
- Stock validation integration
- Status history tracking
