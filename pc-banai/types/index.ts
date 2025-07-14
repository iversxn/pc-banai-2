// pc-banai/types/index.ts

export interface Component {
  id: string
  name: string
  nameBengali: string
  category: ComponentCategory
  brand: string
  specifications: ComponentSpecs
  prices: RetailerPrice[]
  compatibility: CompatibilityInfo
  images: string[]
  reviews: Review[]
  powerConsumption?: number
  socket?: string
  chipset?: string
  memoryType?: string
  maxMemory?: number
  formFactor?: string
}

export interface RetailerPrice {
  retailerId: string
  retailerName: string
  price: number
  currency: "BDT"
  inStock: boolean
  lastUpdated: Date
  shippingCost: number
  warranty: string
  rating: number
  trend: "up" | "down" | "stable"
  productUrl?: string
}

export interface BuildState {
  components: ComponentSelection
  totalPrice: number
  compatibility: CompatibilityCheck
  selectedRetailers: RetailerSelection
  wattage: number
}

export interface ComponentSelection {
  cpu?: Component
  motherboard?: Component
  ram?: Component[]
  gpu?: Component
  storage?: Component[]
  psu?: Component
  case?: Component
  cooling?: Component
}

export interface CompatibilityCheck {
  isCompatible: boolean
  warnings: CompatibilityWarning[]
  errors: CompatibilityError[]
}

export interface CompatibilityWarning {
  type: string
  message: string
  messageBengali: string
  components: string[]
}

export interface CompatibilityError {
  type: string
  message: string
  messageBengali: string
  components: string[]
}

export type ComponentCategory = "cpu" | "motherboard" | "ram" | "gpu" | "storage" | "psu" | "case" | "cooling"

export interface ComponentSpecs {
  summary: string | null
  wattage?: number
  [key: string]: string | number | boolean | null
}

export interface CompatibilityInfo {
  socket?: string | null
  chipset?: string[]
  memoryType?: string[]
  formFactor?: string[]
  maxTDP?: number
}

export interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  commentBengali?: string
  date: Date
  helpful: number
}

export interface RetailerSelection {
  [componentId: string]: string // retailerId
}

export interface User {
  id: string
  name: string
  email: string
  builds: SavedBuild[]
  preferences: UserPreferences
}

export interface SavedBuild {
  id: string
  name: string
  nameBengali: string
  components: ComponentSelection
  totalPrice: number
  createdAt: Date
  isPublic: boolean
}

export interface UserPreferences {
  language: "en" | "bn"
  currency: "BDT"
  priceAlerts: PriceAlert[]
}

export interface PriceAlert {
  componentId: string
  targetPrice: number
  isActive: boolean
}
