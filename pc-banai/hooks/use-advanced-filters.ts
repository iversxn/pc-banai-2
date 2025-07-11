"use client"

import { useState, useMemo } from "react"
import type { Component } from "@/types"

interface AdvancedFilters {
  priceRange: [number, number]
  brands: string[]
  inStockOnly: boolean
  specifications: {
    cpuCores?: number[]
    ramSpeed?: number[]
    gpuMemory?: number[]
    storageType?: string[]
    psuEfficiency?: string[]
  }
  retailerPreference: string[]
  sortBy: "price" | "name" | "rating" | "popularity" | "newest"
  sortOrder: "asc" | "desc"
}

export function useAdvancedFilters(components: Component[]) {
  const [filters, setFilters] = useState<AdvancedFilters>({
    priceRange: [0, 500000],
    brands: [],
    inStockOnly: false,
    specifications: {},
    retailerPreference: [],
    sortBy: "price",
    sortOrder: "asc",
  })

  const [searchTerm, setSearchTerm] = useState("")

  const filteredAndSortedComponents = useMemo(() => {
    let filtered = components

    // Text search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (component) =>
          component.name.toLowerCase().includes(search) ||
          component.nameBengali.includes(search) ||
          component.brand.toLowerCase().includes(search) ||
          Object.values(component.specifications).some((spec) => String(spec).toLowerCase().includes(search)),
      )
    }

    // Price range filter
    filtered = filtered.filter((component) => {
      const minPrice = Math.min(...component.prices.map((p) => p.price))
      return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1]
    })

    // Brand filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter((component) => filters.brands.includes(component.brand))
    }

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter((component) => component.prices.some((price) => price.inStock))
    }

    // Specification filters
    if (filters.specifications.cpuCores?.length) {
      filtered = filtered.filter(
        (component) =>
          component.category === "cpu" &&
          filters.specifications.cpuCores!.includes(Number(component.specifications.cores)),
      )
    }

    if (filters.specifications.ramSpeed?.length) {
      filtered = filtered.filter(
        (component) =>
          component.category === "ram" &&
          filters.specifications.ramSpeed!.some((speed) =>
            String(component.specifications.speed).includes(String(speed)),
          ),
      )
    }

    if (filters.specifications.gpuMemory?.length) {
      filtered = filtered.filter(
        (component) =>
          component.category === "gpu" &&
          filters.specifications.gpuMemory!.some((memory) =>
            String(component.specifications.memory).includes(`${memory}GB`),
          ),
      )
    }

    // Retailer preference filter
    if (filters.retailerPreference.length > 0) {
      filtered = filtered.filter((component) =>
        component.prices.some((price) => filters.retailerPreference.includes(price.retailerId)),
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
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
          comparison = bRating - aRating // Higher rating first
          break
        case "popularity":
          // Simulate popularity based on number of reviews/prices
          comparison = b.prices.length - a.prices.length
          break
        case "newest":
          // Simulate newness based on ID (newer components have higher IDs)
          comparison = b.id.localeCompare(a.id)
          break
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }, [components, filters, searchTerm])

  const updateFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 500000],
      brands: [],
      inStockOnly: false,
      specifications: {},
      retailerPreference: [],
      sortBy: "price",
      sortOrder: "asc",
    })
    setSearchTerm("")
  }

  const availableBrands = useMemo(() => {
    const brands = new Set(components.map((c) => c.brand))
    return Array.from(brands).sort()
  }, [components])

  const availableRetailers = useMemo(() => {
    const retailers = new Set(
      components.flatMap((c) => c.prices.map((p) => ({ id: p.retailerId, name: p.retailerName }))),
    )
    return Array.from(retailers)
  }, [components])

  return {
    filters,
    searchTerm,
    setSearchTerm,
    updateFilter,
    resetFilters,
    filteredAndSortedComponents,
    availableBrands,
    availableRetailers,
  }
}
