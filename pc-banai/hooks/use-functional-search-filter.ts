"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Component } from "@/types"

interface RealFilters {
  searchTerm: string
  priceRange: [number, number]
  selectedBrands: string[]
  selectedCategories: string[]
  selectedRetailers: string[]
  inStockOnly: boolean
  sortBy: "price" | "name" | "rating" | "popularity"
  sortOrder: "asc" | "desc"
}

export function useFunctionalSearchFilter(components: Component[]) {
  // REAL FILTER STATE - NOT STATIC
  const [filters, setFilters] = useState<RealFilters>({
    searchTerm: "",
    priceRange: [0, 500000],
    selectedBrands: [],
    selectedCategories: [],
    selectedRetailers: [],
    inStockOnly: false,
    sortBy: "price",
    sortOrder: "asc",
  })

  const [isFiltering, setIsFiltering] = useState(false)
  const [searchResults, setSearchResults] = useState<Component[]>(components)

  // REAL SEARCH FUNCTION - ACTUALLY SEARCHES
  const performRealSearch = useCallback((searchTerm: string, componentList: Component[]): Component[] => {
    if (!searchTerm.trim()) {
      return componentList
    }

    const term = searchTerm.toLowerCase()
    return componentList.filter((component) => {
      // Search in name
      if (component.name.toLowerCase().includes(term)) return true

      // Search in Bengali name
      if (component.nameBengali.includes(searchTerm)) return true

      // Search in brand
      if (component.brand.toLowerCase().includes(term)) return true

      // Search in specifications
      const specMatch = Object.values(component.specifications).some((spec) =>
        String(spec).toLowerCase().includes(term),
      )
      if (specMatch) return true

      // Search in category
      if (component.category.toLowerCase().includes(term)) return true

      return false
    })
  }, [])

  // REAL PRICE FILTER - ACTUALLY FILTERS BY PRICE
  const applyPriceFilter = useCallback((componentList: Component[], range: [number, number]): Component[] => {
    return componentList.filter((component) => {
      const minPrice = Math.min(...component.prices.map((p) => p.price))
      return minPrice >= range[0] && minPrice <= range[1]
    })
  }, [])

  // REAL BRAND FILTER - ACTUALLY FILTERS BY BRAND
  const applyBrandFilter = useCallback((componentList: Component[], brands: string[]): Component[] => {
    if (brands.length === 0) return componentList
    return componentList.filter((component) => brands.includes(component.brand))
  }, [])

  // REAL CATEGORY FILTER - ACTUALLY FILTERS BY CATEGORY
  const applyCategoryFilter = useCallback((componentList: Component[], categories: string[]): Component[] => {
    if (categories.length === 0) return componentList
    return componentList.filter((component) => categories.includes(component.category))
  }, [])

  // REAL RETAILER FILTER - ACTUALLY FILTERS BY RETAILER
  const applyRetailerFilter = useCallback((componentList: Component[], retailers: string[]): Component[] => {
    if (retailers.length === 0) return componentList
    return componentList.filter((component) => component.prices.some((price) => retailers.includes(price.retailerId)))
  }, [])

  // REAL STOCK FILTER - ACTUALLY FILTERS BY STOCK STATUS
  const applyStockFilter = useCallback((componentList: Component[], inStockOnly: boolean): Component[] => {
    if (!inStockOnly) return componentList
    return componentList.filter((component) => component.prices.some((price) => price.inStock))
  }, [])

  // REAL SORTING - ACTUALLY SORTS THE RESULTS
  const applySorting = useCallback((componentList: Component[], sortBy: string, sortOrder: string): Component[] => {
    const sorted = [...componentList].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "price":
          const aPrice = Math.min(...a.prices.map((p) => p.price))
          const bPrice = Math.min(...b.prices.map((p) => p.price))
          comparison = aPrice - bPrice
          break
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "rating":
          const aRating = a.prices.reduce((sum, p) => sum + p.rating, 0) / a.prices.length
          const bRating = b.prices.reduce((sum, p) => sum + p.rating, 0) / b.prices.length
          comparison = bRating - aRating
          break
        case "popularity":
          // Simulate popularity based on number of retailers
          comparison = b.prices.length - a.prices.length
          break
        default:
          comparison = 0
      }

      return sortOrder === "desc" ? -comparison : comparison
    })

    return sorted
  }, [])

  // REAL FILTER APPLICATION - ACTUALLY PROCESSES ALL FILTERS
  const applyAllFilters = useCallback(() => {
    setIsFiltering(true)

    let filtered = [...components]

    // Apply search
    filtered = performRealSearch(filters.searchTerm, filtered)

    // Apply price filter
    filtered = applyPriceFilter(filtered, filters.priceRange)

    // Apply brand filter
    filtered = applyBrandFilter(filtered, filters.selectedBrands)

    // Apply category filter
    filtered = applyCategoryFilter(filtered, filters.selectedCategories)

    // Apply retailer filter
    filtered = applyRetailerFilter(filtered, filters.selectedRetailers)

    // Apply stock filter
    filtered = applyStockFilter(filtered, filters.inStockOnly)

    // Apply sorting
    filtered = applySorting(filtered, filters.sortBy, filters.sortOrder)

    setSearchResults(filtered)
    setIsFiltering(false)
  }, [
    components,
    filters,
    performRealSearch,
    applyPriceFilter,
    applyBrandFilter,
    applyCategoryFilter,
    applyRetailerFilter,
    applyStockFilter,
    applySorting,
  ])

  // REAL DEBOUNCED SEARCH - ACTUALLY DEBOUNCES
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyAllFilters()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, applyAllFilters])

  // REAL FILTER UPDATES - ACTUALLY UPDATE STATE
  const updateSearchTerm = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }))
  }, [])

  const updatePriceRange = useCallback((range: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: range }))
  }, [])

  const toggleBrand = useCallback((brand: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brand)
        ? prev.selectedBrands.filter((b) => b !== brand)
        : [...prev.selectedBrands, brand],
    }))
  }, [])

  const toggleCategory = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }))
  }, [])

  const toggleRetailer = useCallback((retailer: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedRetailers: prev.selectedRetailers.includes(retailer)
        ? prev.selectedRetailers.filter((r) => r !== retailer)
        : [...prev.selectedRetailers, retailer],
    }))
  }, [])

  const toggleInStockOnly = useCallback(() => {
    setFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))
  }, [])

  const updateSorting = useCallback((sortBy: string, sortOrder: string) => {
    setFilters((prev) => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }))
  }, [])

  const resetAllFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      priceRange: [0, 500000],
      selectedBrands: [],
      selectedCategories: [],
      selectedRetailers: [],
      inStockOnly: false,
      sortBy: "price",
      sortOrder: "asc",
    })
  }, [])

  // REAL AVAILABLE OPTIONS - ACTUALLY COMPUTED FROM DATA
  const availableOptions = useMemo(() => {
    const brands = new Set<string>()
    const categories = new Set<string>()
    const retailers = new Set<string>()

    components.forEach((component) => {
      brands.add(component.brand)
      categories.add(component.category)
      component.prices.forEach((price) => {
        retailers.add(price.retailerId)
      })
    })

    return {
      brands: Array.from(brands).sort(),
      categories: Array.from(categories).sort(),
      retailers: Array.from(retailers).sort(),
    }
  }, [components])

  return {
    filters,
    searchResults,
    isFiltering,
    availableOptions,
    updateSearchTerm,
    updatePriceRange,
    toggleBrand,
    toggleCategory,
    toggleRetailer,
    toggleInStockOnly,
    updateSorting,
    resetAllFilters,
  }
}
