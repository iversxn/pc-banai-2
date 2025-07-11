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
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"
import { allExpandedComponents } from "@/data/expanded-components"
import { Search, Filter, X, SlidersHorizontal } from "lucide-react"

export function AdvancedFilters() {
  const {
    filters,
    searchTerm,
    setSearchTerm,
    updateFilter,
    resetFilters,
    filteredAndSortedComponents,
    availableBrands,
    availableRetailers,
  } = useAdvancedFilters(allExpandedComponents)

  const [showAdvanced, setShowAdvanced] = useState(false)

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
            <SelectItem value="newest">Newest</SelectItem>
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

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range (৳)</Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                max={500000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>৳{filters.priceRange[0].toLocaleString()}</span>
                <span>৳{filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <Label>Brands</Label>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((brand) => (
                  <Badge
                    key={brand}
                    variant={filters.brands.includes(brand) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newBrands = filters.brands.includes(brand)
                        ? filters.brands.filter((b) => b !== brand)
                        : [...filters.brands, brand]
                      updateFilter("brands", newBrands)
                    }}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Retailer Preference */}
            <div className="space-y-2">
              <Label>Preferred Retailers</Label>
              <div className="flex flex-wrap gap-2">
                {availableRetailers.map((retailer) => (
                  <Badge
                    key={retailer.id}
                    variant={filters.retailerPreference.includes(retailer.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newRetailers = filters.retailerPreference.includes(retailer.id)
                        ? filters.retailerPreference.filter((r) => r !== retailer.id)
                        : [...filters.retailerPreference, retailer.id]
                      updateFilter("retailerPreference", newRetailers)
                    }}
                  >
                    {retailer.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {filteredAndSortedComponents.length} components</p>
        <div className="flex gap-2">
          {filters.brands.map((brand) => (
            <Badge key={brand} variant="secondary" className="flex items-center gap-1">
              {brand}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  updateFilter(
                    "brands",
                    filters.brands.filter((b) => b !== brand),
                  )
                }
              />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
