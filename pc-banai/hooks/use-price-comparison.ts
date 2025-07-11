"use client"

import { useState, useCallback, useMemo } from "react"
import type { Component, RetailerPrice } from "@/types"
import { allComponents } from "@/data/components"

export function usePriceComparison() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [sortBy, setSortBy] = useState<"price" | "name" | "rating">("price")

  const filteredComponents = useMemo(() => {
    let filtered = allComponents

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (component) =>
          component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          component.nameBengali.includes(searchTerm) ||
          component.brand.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((component) => component.category === selectedCategory)
    }

    // Filter by price range
    filtered = filtered.filter((component) => {
      const minPrice = Math.min(...component.prices.map((p) => p.price))
      return minPrice >= priceRange[0] && minPrice <= priceRange[1]
    })

    // Sort components
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          const aPrice = Math.min(...a.prices.map((p) => p.price))
          const bPrice = Math.min(...b.prices.map((p) => p.price))
          return aPrice - bPrice
        case "name":
          return a.name.localeCompare(b.name)
        case "rating":
          const aRating = a.prices.reduce((sum, p) => sum + p.rating, 0) / a.prices.length
          const bRating = b.prices.reduce((sum, p) => sum + p.rating, 0) / b.prices.length
          return bRating - aRating
        default:
          return 0
      }
    })

    return filtered
  }, [searchTerm, selectedCategory, priceRange, sortBy])

  const getBestDeal = useCallback((component: Component): RetailerPrice => {
    return component.prices.reduce((best, current) => (current.price < best.price ? current : best))
  }, [])

  const getRetailerComparison = useCallback((component: Component) => {
    return component.prices.map((price) => ({
      ...price,
      isBestDeal: price.price === Math.min(...component.prices.map((p) => p.price)),
    }))
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    filteredComponents,
    getBestDeal,
    getRetailerComparison,
  }
}
