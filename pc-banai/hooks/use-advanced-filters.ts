"use client"

import { useState, useMemo, useEffect } from "react"

interface PriceData {
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

interface Component {
  id: string
  name: string
  nameBengali: string
  brand: string
  category: string
  specifications: { summary: string }
  compatibility: Record<string, any>
  prices: PriceData[]
  images: string[]
  powerConsumption: number
  socket: string | null
  memoryType: string | null
  formFactor: string | null
  reviews: any[]
}

interface Filters {
  inStockOnly: boolean
  sortBy: string
  sortOrder: "asc" | "desc"
  minPrice: number
  maxPrice: number
  selectedBrands: string[]
  selectedRetailers: string[]
}

export function useAdvancedFilters() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Filters>({
    inStockOnly: false,
    sortBy: "price",
    sortOrder: "asc",
    minPrice: 0,
    maxPrice: 1000000,
    selectedBrands: [],
    selectedRetailers: [],
  })
  const [components, setComponents] = useState<Component[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await fetch('/api/components')
        const data = await response.json()
        setComponents(data)
      } catch (error) {
        console.error("Failed to fetch components:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchComponents()
  }, [])

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      inStockOnly: false,
      sortBy: "price",
      sortOrder: "asc",
      minPrice: 0,
      maxPrice: 1000000,
      selectedBrands: [],
      selectedRetailers: [],
    })
    setSearchTerm("")
  }

  const filteredAndSortedComponents = useMemo(() => {
    let filtered = [...components]

    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(term) ||
        comp.brand.toLowerCase().includes(term) ||
        comp.category.toLowerCase().includes(term)
      )
    }

    // Apply in-stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(comp => 
        comp.prices.some(p => p.inStock)
      )
    }

    // Apply price range filter
    filtered = filtered.filter(comp => {
      const minPrice = Math.min(...comp.prices.map(p => p.price).filter(p => p > 0))
      return minPrice >= filters.minPrice && minPrice <= filters.maxPrice
    })

    // Apply brand filter
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(comp => 
        filters.selectedBrands.includes(comp.brand)
      )
    }

    // Apply retailer filter
    if (filters.selectedRetailers.length > 0) {
      filtered = filtered.filter(comp =>
        comp.prices.some(p => filters.selectedRetailers.includes(p.retailerName))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aMinPrice = Math.min(...a.prices.map(p => p.price).filter(p => p > 0))
      const bMinPrice = Math.min(...b.prices.map(p => p.price).filter(p => p > 0))
      
      if (filters.sortBy === "price") {
        return filters.sortOrder === "asc" ? aMinPrice - bMinPrice : bMinPrice - aMinPrice
      } else if (filters.sortBy === "name") {
        return filters.sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      } else if (filters.sortBy === "stock") {
        const aStock = a.prices.some(p => p.inStock)
        const bStock = b.prices.some(p => p.inStock)
        return filters.sortOrder === "asc" 
          ? (aStock === bStock ? 0 : aStock ? -1 : 1)
          : (aStock === bStock ? 0 : bStock ? -1 : 1)
      }
      return 0
    })

    return filtered
  }, [components, searchTerm, filters])

  const availableBrands = useMemo(() => {
    const brands = new Set<string>()
    components.forEach(comp => brands.add(comp.brand))
    return Array.from(brands).sort()
  }, [components])

  const availableRetailers = useMemo(() => {
    const retailers = new Set<string>()
    components.forEach(comp => {
      comp.prices.forEach(p => retailers.add(p.retailerName))
    })
    return Array.from(retailers).sort()
  }, [components])

  const getRetailerComparison = (component: Component) => {
    return component.prices.map(price => ({
      ...price,
      isBestDeal: price.price === Math.min(...component.prices.map(p => p.price))
    }))
  }

  return {
    filters,
    searchTerm,
    setSearchTerm,
    updateFilter,
    resetFilters,
    filteredAndSortedComponents,
    isLoading,
    availableBrands,
    availableRetailers,
    getRetailerComparison,
  }
}
