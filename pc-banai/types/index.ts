export interface Component {
  id: string
  name: string
  nameBengali: string
  brand: string
  category: string
  specifications: Record<string, any>
  compatibility: Record<string, any>
  prices: PriceData[]
  images: string[]
  powerConsumption: number
  socket: string | null
  memoryType: string | null
  formFactor: string | null
  reviews: any[]
  product_name?: string
  short_specs?: string
  image_url?: string
  price_bdt?: string | number
  availability?: string
  product_url?: string
}

export interface PriceData {
  retailerId: string
  retailerName: string
  price: number
  currency: string
  inStock: boolean
  productUrl?: string
  lastUpdated: Date
  shippingCost: number
  warranty: string
  rating: number
  trend: "up" | "down" | "stable"
  isBestDeal?: boolean
}

export interface BuildComponent {
  id: string | number
  name?: string
  category?: string
  price?: number
  brand?: string
  socket?: string
  form_factor?: string
  [key: string]: any
}

export interface SelectedBuild {
  [category: string]: BuildComponent | null
}

export interface CompatibilityError {
  type: string
  message: string
  components?: string[]
}

export interface Filters {
  inStockOnly: boolean
  sortBy: string
  sortOrder: "asc" | "desc"
  minPrice: number
  maxPrice: number
  selectedBrands: string[]
  selectedRetailers: string[]
}
