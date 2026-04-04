export const testUser = {
  firstName: 'E2E',
  lastName: 'Tester',
  email: 'e2e-test@example.com',
  password: 'TestP@ssw0rd!',
  confirmPassword: 'TestP@ssw0rd!',
  phone: '+44 7700 900123'
};

export const testShippingAddress = {
  fullName: 'E2E Tester',
  addressLine1: '123 Test Street',
  addressLine2: 'Apt 4B',
  city: 'London',
  state: 'Greater London',
  stateProvince: 'Greater London',
  postalCode: 'SW1A 1AA',
  country: 'GB',
  phone: '+44 7700 900123'
};

export const testBillingAddress = {
  fullName: 'E2E Tester',
  addressLine1: '123 Test Street',
  addressLine2: 'Apt 4B',
  city: 'London',
  state: 'Greater London',
  stateProvince: 'Greater London',
  postalCode: 'SW1A 1AA',
  country: 'GB'
};

export const testProducts = [
  {
    _id: 'prod-001',
    name: 'Google Pixel 8 - GrapheneOS',
    slug: 'google-pixel-8-grapheneos',
    priceRange: { min: 699.99, max: 699.99 },
    isInStock: true,
    images: ['/images/pixel8-front.webp'],
    shortDescription: 'Google Pixel 8 pre-installed with GrapheneOS for maximum privacy.',
    category: { slug: 'smartphones' },
    availableColors: ['Obsidian', 'Hazel'],
    availableConditions: ['new'],
    availableStorage: ['128GB']
  },
  {
    _id: 'prod-002',
    name: 'Google Pixel 8 Pro - GrapheneOS',
    slug: 'google-pixel-8-pro-grapheneos',
    priceRange: { min: 999.99, max: 999.99 },
    isInStock: true,
    images: ['/images/pixel8pro-front.webp'],
    shortDescription: 'Google Pixel 8 Pro pre-installed with GrapheneOS.',
    category: { slug: 'smartphones' },
    availableColors: ['Obsidian', 'Porcelain'],
    availableConditions: ['new'],
    availableStorage: ['128GB']
  },
  {
    _id: 'prod-003',
    name: 'Google Pixel 7 - GrapheneOS (Refurbished)',
    slug: 'google-pixel-7-grapheneos-refurb',
    priceRange: { min: 449.99, max: 449.99 },
    isInStock: true,
    images: ['/images/pixel7-front.webp'],
    shortDescription: 'Refurbished Pixel 7 with GrapheneOS installed.',
    category: { slug: 'smartphones' },
    availableColors: ['Obsidian'],
    availableConditions: ['refurbished'],
    availableStorage: ['128GB']
  }
];

export const testProductDetail = {
  _id: 'prod-001',
  name: 'Google Pixel 8 - GrapheneOS',
  slug: 'google-pixel-8-grapheneos',
  price: 699.99,
  priceRange: { min: 699.99, max: 699.99 },
  inStock: true,
  images: ['/images/pixel8-front.webp'],
  shortDescription: 'Google Pixel 8 pre-installed with GrapheneOS for maximum privacy.',
  description: 'The Google Pixel 8 with GrapheneOS provides a secure, privacy-focused smartphone experience. Features include verified boot, sandboxed Google Play services, and regular security updates.',
  category: { slug: 'smartphones' },
  baseModel: 'Google Pixel 8',
  variations: [
    { _id: 'var-001', name: '128GB', price: 699.99, stock: true },
    { _id: 'var-002', name: '256GB', price: 799.99, stock: true }
  ],
  attributes: [
    { name: 'Display', value: '6.2" OLED, 1080 x 2400' },
    { name: 'Processor', value: 'Google Tensor G3' },
    { name: 'RAM', value: '8GB' },
    { name: 'Storage', value: '128GB' },
    { name: 'Battery', value: '4,575 mAh' }
  ]
};

export const testOrders = [
  {
    _id: 'order-001',
    orderNumber: 'GS-2024-001',
    status: 'delivered',
    statusDisplay: 'Delivered',
    createdAt: '2024-12-15T10:30:00Z',
    formattedDate: '15 December 2024',
    totalAmount: 699.99,
    itemCount: 1,
    items: [
      {
        productId: 'prod-001',
        name: 'Google Pixel 8 - GrapheneOS',
        productName: 'Google Pixel 8 - GrapheneOS',
        productSlug: 'google-pixel-8-grapheneos',
        quantity: 1,
        price: 699.99,
        unitPrice: 699.99,
        totalPrice: 699.99,
        productImage: '/images/pixel8-front.webp'
      }
    ],
    paymentMethod: { type: 'paypal' },
    paymentMethodDisplay: 'PayPal',
    shippingAddress: {
      fullName: 'E2E Tester',
      firstName: 'E2E',
      lastName: 'Tester',
      addressLine1: '123 Test Street',
      city: 'London',
      stateProvince: 'Greater London',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    billingAddress: {
      fullName: 'E2E Tester',
      firstName: 'E2E',
      lastName: 'Tester',
      addressLine1: '123 Test Street',
      city: 'London',
      stateProvince: 'Greater London',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    }
  },
  {
    _id: 'order-002',
    orderNumber: 'GS-2024-002',
    status: 'processing',
    statusDisplay: 'Processing',
    createdAt: '2024-12-20T14:00:00Z',
    formattedDate: '20 December 2024',
    totalAmount: 999.99,
    itemCount: 1,
    items: [
      {
        productId: 'prod-002',
        name: 'Google Pixel 8 Pro - GrapheneOS',
        productName: 'Google Pixel 8 Pro - GrapheneOS',
        productSlug: 'google-pixel-8-pro-grapheneos',
        quantity: 1,
        price: 999.99,
        unitPrice: 999.99,
        totalPrice: 999.99,
        productImage: '/images/pixel8pro-front.webp'
      }
    ],
    paymentMethod: { type: 'bitcoin' },
    paymentMethodDisplay: 'Bitcoin',
    shippingAddress: {
      fullName: 'E2E Tester',
      firstName: 'E2E',
      lastName: 'Tester',
      addressLine1: '123 Test Street',
      city: 'London',
      stateProvince: 'Greater London',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    billingAddress: {
      fullName: 'E2E Tester',
      firstName: 'E2E',
      lastName: 'Tester',
      addressLine1: '123 Test Street',
      city: 'London',
      stateProvince: 'Greater London',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    }
  }
];

export const testCartItems = [
  {
    _id: 'cart-item-001',
    productId: 'prod-001',
    name: 'Google Pixel 8 - GrapheneOS',
    slug: 'google-pixel-8-grapheneos',
    price: 699.99,
    quantity: 1,
    image: '/images/pixel8-front.webp'
  }
];

export const testCart = {
  items: [
    {
      _id: 'cart-item-001',
      productId: 'prod-001',
      name: 'Google Pixel 8 - GrapheneOS',
      slug: 'google-pixel-8-grapheneos',
      price: 699.99,
      quantity: 1,
      image: '/images/pixel8-front.webp'
    }
  ],
  totalItems: 1,
  totalAmount: 699.99,
  itemCount: 1
};
