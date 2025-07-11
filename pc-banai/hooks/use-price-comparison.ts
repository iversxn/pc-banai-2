"use client"

import { useState, useMemo } from "react"
import type { Component, Price } from "@/types"
import { allExpandedComponents } from "@/data/expanded-components"

export function usePriceComparison() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all")

  const filteredComponents = useMemo(() => {
    let components = allExpandedComponents

    // Filter by category
    if (selectedCategory !== "all") {
      components = components.filter((c) => c.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      components = components.filter(
        (component) =>
          component.name.toLowerCase().includes(search) ||
          component.brand.toLowerCase().includes(search) ||
          component.nameBengali.toLowerCase().includes(search)
      )
    }

    return components
  }, [searchTerm, selectedCategory])

  const getBestDeal = (component: Component): Price | undefined => {
    return component.prices.reduce((best, current) => {
      if (!best || current.price < best.price) {
        return current
      }
      return best
    }, undefined as Price | undefined)
  }

  const getRetailerComparison = (component: Component) => {
    const bestPrice = getBestDeal(component)?.price
    return component.prices
      .map((price) => ({
        ...price,
        isBestDeal: price.price === bestPrice,
      }))
      .sort((a, b) => a.price - b.price)
  }

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredComponents,
    getBestDeal,
    getRetailerComparison,
  }
}
