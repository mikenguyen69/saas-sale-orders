# SaaS Sale Orders - Order Flow Diagram

## Complete Order Workflow

The following diagram shows the complete sale order workflow with role-based transitions and business logic.

```mermaid
stateDiagram-v2
    [*] --> Draft : Salesperson creates order

    state "Draft Order" as Draft {
        [*] --> OrderCreation
        OrderCreation --> ProductSelection : Add products
        ProductSelection --> CustomerDetails : Set customer info
        CustomerDetails --> OrderValidation : Validate order
        OrderValidation --> ReadyToSubmit : All items valid
    }

    Draft --> Submitted : Salesperson submits\n(Stock validation)
    Draft --> [*] : Delete draft order

    state "Submitted Order" as Submitted {
        [*] --> ManagerReview
        ManagerReview --> StockCheck : Manager reviews
        StockCheck --> ApprovalDecision : Check inventory
    }

    Submitted --> Approved : Manager approves\n(Re-validate stock)
    Submitted --> Rejected : Manager rejects\n(with reason)

    state "Approved Order" as Approved {
        [*] --> WarehouseQueue
        WarehouseQueue --> InventoryAllocation : Assigned to warehouse
        InventoryAllocation --> FulfillmentPrep : Allocate stock
    }

    Approved --> Fulfilled : Warehouse fulfills\n(Deduct inventory)

    state "Rejected Order" as Rejected {
        [*] --> RejectionReason
        RejectionReason --> NotifyUser : Manager provides reason
    }

    Rejected --> Draft : Salesperson can revise\nand resubmit

    state "Fulfilled Order" as Fulfilled {
        [*] --> StockDeducted
        StockDeducted --> OrderComplete : Inventory updated
        OrderComplete --> AuditLog : Status history recorded
    }

    Fulfilled --> [*] : Order complete

    note right of Draft
        Roles: Salesperson
        - Create order
        - Add/edit products
        - Set customer details
        - Submit when ready
    end note

    note right of Submitted
        Roles: Manager
        - Review order details
        - Check business rules
        - Approve or reject
    end note

    note right of Approved
        Roles: Warehouse Staff
        - Process fulfillment
        - Update inventory
        - Mark as fulfilled
    end note

    note right of Rejected
        Roles: Salesperson
        - Review rejection reason
        - Make necessary changes
        - Resubmit as new draft
    end note
```

## Role-Based Action Matrix

| Status        | Salesperson Actions             | Manager Actions    | Warehouse Actions |
| ------------- | ------------------------------- | ------------------ | ----------------- |
| **Draft**     | ✅ Create, Edit, Delete, Submit | ❌                 | ❌                |
| **Submitted** | ❌                              | ✅ Approve, Reject | ❌                |
| **Approved**  | ❌                              | ❌                 | ✅ Fulfill        |
| **Rejected**  | ✅ Revise → Draft               | ❌                 | ❌                |
| **Fulfilled** | ❌                              | ❌                 | ❌                |

## Order Item Status Flow

```mermaid
stateDiagram-v2
    [*] --> Pending : Item added to order

    Pending --> InStock : Stock available
    Pending --> OutOfStock : Insufficient stock

    InStock --> Fulfilled : Order fulfilled
    OutOfStock --> Backordered : Partial fulfillment

    Backordered --> Fulfilled : Stock replenished

    Fulfilled --> [*] : Item complete
```

## Business Rules & Validations

### Stock Validation Points

1. **Order Submission**: Check stock availability for all items
2. **Manager Approval**: Re-validate stock before approval
3. **Fulfillment**: Final stock check and deduction

### Transition Rules

- **Draft → Submitted**: Requires valid items and customer details
- **Submitted → Approved**: Manager role required, stock must be available
- **Submitted → Rejected**: Manager role required, reason mandatory
- **Approved → Fulfilled**: Warehouse role required, stock deduction occurs
- **Rejected → Draft**: Salesperson can revise and create new draft

### Audit Trail

All status changes are logged in `OrderStatusHistory` with:

- Previous status
- New status
- User who made the change
- Timestamp

## Multi-Tenant Security

### Tenant Isolation

- All queries include tenant context validation
- Row Level Security (RLS) policies enforce data isolation
- API endpoints validate tenant ownership

### Role-Based Access Control

- Users have specific roles: `salesperson`, `manager`, `warehouse`
- Actions are validated against user role and order status
- Cross-tenant data access is prevented

## Real-time Updates

The system supports real-time updates via Supabase Realtime:

- Order status changes broadcast to relevant users
- Stock level updates reflected immediately
- Manager notifications for pending approvals

## Error Handling

### Common Validation Errors

- **Items Required**: Order must have at least one item
- **Stock Unavailable**: Item quantity exceeds available stock
- **Unauthorized**: User lacks permission for requested action
- **Invalid Transition**: Status change not allowed from current state

### Recovery Mechanisms

- Rejected orders can be revised and resubmitted
- Draft orders can be saved and resumed later
- Stock validation occurs at multiple checkpoints
