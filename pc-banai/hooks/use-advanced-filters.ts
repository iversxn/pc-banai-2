"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdvancedFilters } from "@/hooks/use-advanced-filters" // Hook now fetches its own data
import { Search, Filter, X, SlidersHorizontal, Loader2 } from "lucide-react"
import { Skeleton } from "./ui/skeleton"

export function AdvancedFilters() {
  // The hook no longer needs any arguments
  const {
    filters,
    searchTerm,
    setSearchTerm,
    updateFilter,
    resetFilters,
    filteredAndSortedComponents,
    isLoading, // <-- Use the new loading state
    availableBrands,
    availableRetailers,
  } = useAdvancedFilters()

  const [showAdvanced, setShowAdvanced] = useState(false)

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-40" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search components, brands, specifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filters
        </Button>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => updateFilter("inStockOnly", !!checked)}
          />
          <Label htmlFor="in-stock" className="text-sm">
            In Stock Only
          </Label>
        </div>

        <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
        >
          {filters.sortOrder === "asc" ? "↑" : "↓"}
        </Button>

        {(filters.brands.length > 0 || filters.inStockOnly || searchTerm) && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {filteredAndSortedComponents.length} components</p>
      </div>
    </div>
  )
}
