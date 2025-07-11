"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Component } from "@/types"
import { Star, TrendingDown, TrendingUp, Search, X, Check } from "lucide-react"

interface FunctionalComponentSelectorProps {
  category: string
  components: Component[]
  selectedComponents?: Component | Component[]
  onSelect: (component: Component) => void
  onRemove: (componentId: string, category: string) => void
}

export function FunctionalComponentSelector({
  category,
  components,
  selectedComponents,
  onSelect,
  onRemove,
}: FunctionalComponentSelectorProps) {
  const [localSearch, setLocalSearch] = useState("")
  const [sortBy, setSortBy] = useState<"price" | "name" | "rating">("price")

  // REAL COMPONENT SELECTION CHECK - ACTUALLY CHECKS STATE
  const isSelected = (component: Component): boolean => {
    if (Array.isArray(selectedComponents)) {
      return selectedComponents.some((c) => c.id === component.id)
    }
    return selectedComponents?.id === component.id
  }

  // REAL LOCAL FILTERING - ACTUALLY FILTERS COMPONENTS
  const filteredComponents = components.filter((component) => {
    if (!localSearch.trim()) return true

    const search = localSearch.toLowerCase()
    return (
      component.name.toLowerCase().includes(search) ||
      component.nameBengali.includes(localSearch) ||
      component.brand.toLowerCase().includes(search) ||
      Object.values(component.specifications).some((spec) => String(spec).toLowerCase().includes(search))
    )
  })

  // REAL SORTING - ACTUALLY SORTS COMPONENTS
  const sortedComponents = [...filteredComponents].sort((a, b) => {
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

  // REAL COMPONENT SELECTION - ACTUALLY CALLS PARENT FUNCTION
  const handleSelect = (component: Component) => {
    onSelect(component)
  }

  // REAL COMPONENT REMOVAL - ACTUALLY CALLS PARENT FUNCTION
  const handleRemove = (component: Component) => {
    onRemove(component.id, category)
  }

  return (
    <div className="space-y-4">
      {/* Real Search and Sort Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${category}...`}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setLocalSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="price">Sort by Price</option>
          <option value="name">Sort by Name</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedComponents.length} of {components.length} components
        {localSearch && ` for "${localSearch}"`}
      </div>

      {/* Component List */}
      {sortedComponents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No components found</p>
          {localSearch && (
            <Button variant="ghost" size="sm" onClick={() => setLocalSearch("")} className="mt-2">
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedComponents.map((component) => {
            const bestPrice = Math.min(...component.prices.map((p) => p.price))
            const bestPriceRetailer = component.prices.find((p) => p.price === bestPrice)
            const selected = isSelected(component)

            return (
              <Card
                key={component.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selected ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{component.name}</h3>
                        <Badge variant="outline">{component.brand}</Badge>
                        {selected && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-blue-600 mb-2 bengali-text">{component.nameBengali}</p>

                      {/* Key Specifications */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Object.entries(component.specifications)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {String(value)}
                            </Badge>
                          ))}
                      </div>

                      {/* Price Information */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-green-600">৳{bestPrice.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            at {bestPriceRetailer?.retailerName}
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{bestPriceRetailer?.rating.toFixed(1)}</span>
                              {bestPriceRetailer?.trend === "down" && (
                                <TrendingDown className="h-3 w-3 text-green-600" />
                              )}
                              {bestPriceRetailer?.trend === "up" && <TrendingUp className="h-3 w-3 text-red-600" />}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {selected ? (
                            <Button size="sm" variant="destructive" onClick={() => handleRemove(component)}>
                              Remove
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleSelect(component)}>
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
