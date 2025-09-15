import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sales Order Management API',
      version: '1.0.0',
      description:
        'A comprehensive API for managing sales orders, products, and users with role-based access control',
      contact: {
        name: 'API Support',
        email: 'support@salesorder.com',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://your-domain.vercel.app/api/v1'
            : 'http://localhost:3000/api/v1',
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from Supabase authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'role', 'name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['salesperson', 'manager', 'warehouse'],
              description: 'User role in the system',
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user was created',
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'When the user was soft deleted (null if active)',
            },
          },
        },
        Product: {
          type: 'object',
          required: ['id', 'code', 'name', 'wholesalePrice', 'retailPrice', 'stockQuantity'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            code: {
              type: 'string',
              description: 'Unique product code',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            category: {
              type: 'string',
              nullable: true,
              description: 'Product category',
            },
            wholesalePrice: {
              type: 'number',
              format: 'decimal',
              description: 'Wholesale price',
            },
            retailPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Retail price',
            },
            taxRate: {
              type: 'number',
              format: 'decimal',
              description: 'Tax rate (default: 0)',
            },
            stockQuantity: {
              type: 'integer',
              description: 'Current stock quantity',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        SaleOrder: {
          type: 'object',
          required: ['id', 'customerName', 'contactPerson', 'email', 'status', 'salespersonId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            customerName: {
              type: 'string',
              description: 'Customer company name',
            },
            contactPerson: {
              type: 'string',
              description: 'Primary contact person',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Contact email',
            },
            shippingAddress: {
              type: 'string',
              nullable: true,
              description: 'Shipping address',
            },
            deliveryDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Expected delivery date',
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'approved', 'fulfilled', 'rejected'],
              description: 'Current order status',
            },
            salespersonId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the salesperson who created the order',
            },
            managerId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID of the manager who approved/rejected the order',
            },
            warehouseId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID of the warehouse staff who fulfilled the order',
            },
            notes: {
              type: 'string',
              description: 'Additional notes for the order',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        OrderItem: {
          type: 'object',
          required: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'lineTotal'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            orderId: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
            },
            unitPrice: {
              type: 'number',
              format: 'decimal',
            },
            lineTotal: {
              type: 'number',
              format: 'decimal',
            },
            isInStock: {
              type: 'boolean',
              description: 'Whether the product is currently in stock',
            },
            lineStatus: {
              type: 'string',
              enum: ['pending', 'fulfilled', 'backordered'],
              description: 'Status of this specific line item',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        ValidationError: {
          type: 'object',
          required: ['error', 'message', 'issues'],
          properties: {
            error: {
              type: 'string',
              example: 'validation_error',
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  message: {
                    type: 'string',
                  },
                  code: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/v1/**/*.ts'], // Path to the API files
}

export const swaggerSpec = swaggerJSDoc(options)
