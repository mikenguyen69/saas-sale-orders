import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material'
import type { AuthState } from '@/hooks/useAuth'

const theme = createTheme()

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  authState?: Partial<AuthState>
}

// Mock AuthProvider for testing
const MockAuthContext = React.createContext<AuthState | undefined>(undefined)

export function MockAuthProvider({
  children,
  authState = {},
}: {
  children: React.ReactNode
  authState?: Partial<AuthState>
}) {
  const defaultAuthState: AuthState = {
    user: null,
    session: null,
    loading: false,
    signIn: jest.fn().mockResolvedValue({}),
    signUp: jest.fn().mockResolvedValue({}),
    signOut: jest.fn().mockResolvedValue(undefined),
    getAccessToken: jest.fn().mockReturnValue(null),
    ...authState,
  }

  return <MockAuthContext.Provider value={defaultAuthState}>{children}</MockAuthContext.Provider>
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    authState = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <MockAuthProvider authState={authState}>{children}</MockAuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock data factories
export const createMockProduct = (overrides = {}) => ({
  id: '1',
  code: 'TEST001',
  name: 'Test Product',
  category: 'Electronics',
  supplier_id: 'supplier1',
  wholesale_price: 100,
  retail_price: 150,
  tax_rate: 10,
  stock_quantity: 25,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: '1',
  customer_name: 'Test Customer',
  contact_person: 'John Doe',
  email: 'john@example.com',
  shipping_address: '123 Test St, Test City',
  delivery_date: '2024-12-01',
  status: 'draft' as const,
  salesperson_id: 'user1',
  manager_id: null,
  warehouse_id: null,
  notes: 'Test order notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  order_items: [],
  ...overrides,
})

export const createMockOrderItem = (overrides = {}) => ({
  id: '1',
  order_id: '1',
  product_id: 'prod1',
  quantity: 2,
  unit_price: 50,
  line_total: 100,
  is_in_stock: true,
  line_status: 'pending' as const,
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  role: 'salesperson' as const,
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Re-export everything from RTL
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
