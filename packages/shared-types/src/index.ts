// Product Types
export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  salePrice?: number;
  images: string[];
  category?: Category;
  condition: 'new' | 'excellent' | 'good' | 'fair';
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
  stockQuantity: number;
  lowStockThreshold?: number;
  tags: string[];
  attributes: ProductAttribute[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  leadTime?: {
    minDays: number;
    maxDays: number;
    displayText: string;
  };
  status: 'draft' | 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id?: string;
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

// Cart Types
export interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  leadTime?: {
    minDays: number;
    maxDays: number;
    displayText: string;
  };
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

// Order Types
export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string | Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Payment Types
export interface Payment {
  _id: string;
  order: string | Order;
  method: 'paypal' | 'bitcoin' | 'monero';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  transactionId?: string;
  gatewayData?: any;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pages: number;
    limit: number;
    total: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProductForm {
  name: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  salePrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  category: string;
  tags: string;
  status: string;
  condition: string;
  stockStatus: string;
  leadTimeMinDays: string;
  leadTimeMaxDays: string;
  leadTimeDisplayText: string;
}

// Shipping Types
export interface ShippingMethod {
  _id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays: number;
  supportedCountries: string[];
  isActive: boolean;
}

// Constants
export const PAYMENT_METHODS = ['paypal', 'bitcoin', 'monero'] as const;
export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export const PRODUCT_CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
export const STOCK_STATUSES = ['in_stock', 'out_of_stock', 'low_stock'] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type OrderStatus = typeof ORDER_STATUSES[number];
export type ProductCondition = typeof PRODUCT_CONDITIONS[number];
export type StockStatus = typeof STOCK_STATUSES[number];