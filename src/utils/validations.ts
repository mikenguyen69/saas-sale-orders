import * as yup from 'yup'

export const orderSchema = yup.object().shape({
  customerName: yup.string().required('Customer name is required'),
  contactPerson: yup.string().required('Contact person is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  shippingAddress: yup.string(),
  deliveryDate: yup.date().nullable(),
  notes: yup.string(),
})

export const orderItemSchema = yup.object().shape({
  productId: yup.string().required('Product is required'),
  quantity: yup
    .number()
    .positive('Quantity must be positive')
    .integer('Quantity must be a whole number')
    .required('Quantity is required'),
  unitPrice: yup
    .number()
    .positive('Unit price must be positive')
    .required('Unit price is required'),
})

export const productSchema = yup.object().shape({
  code: yup.string().required('Product code is required'),
  name: yup.string().required('Product name is required'),
  category: yup.string(),
  wholesalePrice: yup
    .number()
    .positive('Wholesale price must be positive')
    .required('Wholesale price is required'),
  retailPrice: yup
    .number()
    .positive('Retail price must be positive')
    .required('Retail price is required'),
  taxRate: yup.number().min(0).max(1),
  stockQuantity: yup
    .number()
    .integer('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .required('Stock quantity is required'),
})

export const userSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  name: yup.string().required('Name is required'),
  role: yup.string().oneOf(['salesperson', 'manager', 'warehouse']).required('Role is required'),
})
