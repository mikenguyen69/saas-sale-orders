export const ORDER_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PACKING: 'packing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
} as const

export const LINE_STATUSES = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  BACKORDERED: 'backordered',
} as const

export const USER_ROLES = {
  SALESPERSON: 'salesperson',
  MANAGER: 'manager',
  WAREHOUSE: 'warehouse',
} as const

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.DRAFT]: 'Draft',
  [ORDER_STATUSES.SUBMITTED]: 'Submitted',
  [ORDER_STATUSES.APPROVED]: 'Approved',
  [ORDER_STATUSES.PACKING]: 'Packing',
  [ORDER_STATUSES.PACKED]: 'Packed',
  [ORDER_STATUSES.SHIPPED]: 'Shipped',
  [ORDER_STATUSES.DELIVERED]: 'Delivered',
  [ORDER_STATUSES.FULFILLED]: 'Fulfilled',
  [ORDER_STATUSES.REJECTED]: 'Rejected',
}

export const LINE_STATUS_LABELS = {
  [LINE_STATUSES.PENDING]: 'Pending',
  [LINE_STATUSES.FULFILLED]: 'Fulfilled',
  [LINE_STATUSES.BACKORDERED]: 'Backordered',
}

export const USER_ROLE_LABELS = {
  [USER_ROLES.SALESPERSON]: 'Salesperson',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.WAREHOUSE]: 'Warehouse Staff',
}

export const ORDER_WORKFLOW = {
  [ORDER_STATUSES.DRAFT]: {
    canTransitionTo: [ORDER_STATUSES.SUBMITTED],
    allowedRoles: [USER_ROLES.SALESPERSON],
  },
  [ORDER_STATUSES.SUBMITTED]: {
    canTransitionTo: [ORDER_STATUSES.APPROVED, ORDER_STATUSES.REJECTED],
    allowedRoles: [USER_ROLES.MANAGER],
  },
  [ORDER_STATUSES.APPROVED]: {
    canTransitionTo: [ORDER_STATUSES.PACKING],
    allowedRoles: [USER_ROLES.WAREHOUSE],
  },
  [ORDER_STATUSES.PACKING]: {
    canTransitionTo: [ORDER_STATUSES.PACKED],
    allowedRoles: [USER_ROLES.WAREHOUSE],
  },
  [ORDER_STATUSES.PACKED]: {
    canTransitionTo: [ORDER_STATUSES.SHIPPED],
    allowedRoles: [USER_ROLES.WAREHOUSE],
  },
  [ORDER_STATUSES.SHIPPED]: {
    canTransitionTo: [ORDER_STATUSES.DELIVERED],
    allowedRoles: [USER_ROLES.WAREHOUSE],
  },
  [ORDER_STATUSES.DELIVERED]: {
    canTransitionTo: [ORDER_STATUSES.FULFILLED],
    allowedRoles: [USER_ROLES.WAREHOUSE],
  },
  [ORDER_STATUSES.FULFILLED]: {
    canTransitionTo: [],
    allowedRoles: [],
  },
  [ORDER_STATUSES.REJECTED]: {
    canTransitionTo: [ORDER_STATUSES.DRAFT],
    allowedRoles: [USER_ROLES.SALESPERSON],
  },
}
