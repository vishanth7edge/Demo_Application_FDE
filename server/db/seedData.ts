// Deterministic demo data. Facilitator docs quote these exact values, so change them together.

import type { UserRole } from '../../src/domains/auth/domain/auth.types.ts'
import type {
  ProductCategory,
  ProductStatus,
} from '../../src/domains/products/domain/product.types.ts'

export interface SeedUser {
  email: string
  name: string
  role: UserRole
  /** Demo-only password, documented in README.md. Hashed before it is stored. */
  password: string
}

export interface SeedProduct {
  name: string
  sku: string
  category: ProductCategory
  priceCents: number
  quantity: number
  status: ProductStatus
  createdAt: string
}

export const SEED_USERS: SeedUser[] = [
  { email: 'admin@buggystore.test', name: 'Jordan Lee', role: 'admin', password: 'Admin@123' },
  { email: 'viewer@buggystore.test', name: 'Sam Rivera', role: 'viewer', password: 'Viewer@123' },
]

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: 'Wireless Ergonomic Mouse',
    sku: 'EL-1001',
    category: 'Electronics',
    priceCents: 2999,
    quantity: 142,
    status: 'active',
    createdAt: '2026-08-04T09:15:00.000Z',
  },
  {
    name: 'Mechanical Keyboard (TKL)',
    sku: 'EL-1002',
    category: 'Electronics',
    priceCents: 8950,
    quantity: 8,
    status: 'active',
    createdAt: '2026-08-07T10:40:00.000Z',
  },
  {
    name: '27" 4K Monitor',
    sku: 'EL-1003',
    category: 'Electronics',
    priceCents: 32900,
    quantity: 25,
    status: 'active',
    createdAt: '2026-08-11T14:05:00.000Z',
  },
  {
    name: 'USB-C Docking Station',
    sku: 'EL-1004',
    category: 'Electronics',
    priceCents: 14999,
    quantity: 0,
    status: 'inactive',
    createdAt: '2026-08-15T08:30:00.000Z',
  },
  {
    name: 'Noise-Cancelling Headphones',
    sku: 'EL-1005',
    category: 'Electronics',
    priceCents: 19900,
    quantity: 10,
    status: 'active',
    createdAt: '2026-08-19T16:20:00.000Z',
  },
  {
    name: 'Stainless Steel Water Bottle 750ml',
    sku: 'HK-2001',
    category: 'Home & Kitchen',
    priceCents: 2495,
    quantity: 300,
    status: 'active',
    createdAt: '2026-08-22T11:00:00.000Z',
  },
  {
    name: 'Salt & Pepper Grinder Set',
    sku: 'HK-2002',
    category: 'Home & Kitchen',
    priceCents: 3400,
    quantity: 57,
    status: 'active',
    createdAt: '2026-08-26T13:45:00.000Z',
  },
  {
    name: 'Cast Iron Skillet 12"',
    sku: 'HK-2003',
    category: 'Home & Kitchen',
    priceCents: 4500,
    quantity: 3,
    status: 'discontinued',
    createdAt: '2026-08-30T09:10:00.000Z',
  },
  {
    name: 'Ergonomic Mesh Office Chair with Adjustable Lumbar Support',
    sku: 'OF-3001',
    category: 'Office Supplies',
    priceCents: 124900,
    quantity: 12,
    status: 'active',
    createdAt: '2026-09-03T15:30:00.000Z',
  },
  {
    name: 'A5 Dotted Notebook (3-Pack)',
    sku: 'OF-3002',
    category: 'Office Supplies',
    priceCents: 1875,
    quantity: 95,
    status: 'active',
    createdAt: '2026-09-08T10:05:00.000Z',
  },
  {
    name: 'Standing Desk Converter',
    sku: 'OF-3003',
    category: 'Office Supplies',
    priceCents: 129900,
    quantity: 4,
    status: 'active',
    createdAt: '2026-09-12T12:50:00.000Z',
  },
  {
    name: 'Yoga Mat Pro 6mm',
    sku: 'SP-4001',
    category: 'Sports & Outdoors',
    priceCents: 3999,
    quantity: 64,
    status: 'active',
    createdAt: '2026-09-17T07:35:00.000Z',
  },
  {
    name: 'Trail Running Backpack 20L',
    sku: 'SP-4002',
    category: 'Sports & Outdoors',
    priceCents: 7400,
    quantity: 0,
    status: 'discontinued',
    createdAt: '2026-09-22T17:15:00.000Z',
  },
  {
    name: '100% Cotton Crew T-Shirt',
    sku: 'AP-5001',
    category: 'Apparel',
    priceCents: 999,
    quantity: 210,
    status: 'active',
    createdAt: '2026-09-28T09:55:00.000Z',
  },
  {
    name: 'Waterproof Rain Jacket',
    sku: 'AP-5002',
    category: 'Apparel',
    priceCents: 11900,
    quantity: 37,
    status: 'inactive',
    createdAt: '2026-10-05T14:25:00.000Z',
  },
  {
    name: 'Vitamin C Brightening Serum 30ml',
    sku: 'BH-6001',
    category: 'Beauty & Health',
    priceCents: 2250,
    quantity: 18,
    status: 'active',
    createdAt: '2026-10-14T08:45:00.000Z',
  },
]

const LARGE_ADJECTIVES = [
  'Classic',
  'Compact',
  'Deluxe',
  'Eco',
  'Essential',
  'Premium',
  'Smart',
  'Ultra',
]
const LARGE_NOUNS: Record<ProductCategory, string[]> = {
  Electronics: ['Charger', 'Speaker', 'Webcam', 'Power Bank', 'Router'],
  'Home & Kitchen': ['Kettle', 'Cutting Board', 'Lunch Box', 'Coffee Grinder', 'Mixing Bowl'],
  'Office Supplies': ['Desk Lamp', 'Stapler', 'Planner', 'Monitor Stand', 'Pen Set'],
  'Sports & Outdoors': ['Water Flask', 'Resistance Band', 'Camping Lantern', 'Jump Rope'],
  Apparel: ['Hoodie', 'Beanie', 'Rain Poncho', 'Running Socks'],
  'Beauty & Health': ['Face Mask', 'Hand Cream', 'Bamboo Toothbrush', 'Lip Balm'],
}
const LARGE_STATUSES: ProductStatus[] = [
  'active',
  'active',
  'active',
  'active',
  'inactive',
  'discontinued',
]

/** Small deterministic PRNG (mulberry32) so the large dataset is identical on every reset. */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 300 extra products for performance and pagination testing (`npm run db:reset:large`). */
export function buildLargeDataset(count = 300): SeedProduct[] {
  const random = createRandom(20261021)
  const categories = Object.keys(LARGE_NOUNS) as ProductCategory[]
  const start = Date.parse('2026-01-05T09:00:00.000Z')
  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length] ?? 'Electronics'
    const nouns = LARGE_NOUNS[category]
    const noun = nouns[Math.floor(random() * nouns.length)] ?? 'Item'
    const adjective = LARGE_ADJECTIVES[Math.floor(random() * LARGE_ADJECTIVES.length)] ?? 'Classic'
    const number = String(index + 1).padStart(4, '0')
    return {
      name: `${adjective} ${noun} ${number}`,
      sku: `GEN-${number}`,
      category,
      priceCents: 199 + Math.floor(random() * 49_800),
      quantity: Math.floor(random() * 400),
      status: LARGE_STATUSES[Math.floor(random() * LARGE_STATUSES.length)] ?? 'active',
      createdAt: new Date(start + index * 13 * 60 * 60 * 1000).toISOString(),
    }
  })
}
