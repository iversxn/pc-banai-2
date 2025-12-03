"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, X, SlidersHorizontal } from "lucide-react"

interface AdvancedFiltersProps {
  filters: any
  onFilterChange: (key: string, value: any) => void
  onSearchChange: (value: string) => void
  onReset: () => void
  availableBrands: string[]
  availableRetailers: string[]
}

export default function AdvancedFilters({
  filters,
  onFilterChange,
  onSearchChange,
  onReset,
  availableBrands,
  availableRetailers,
}: AdvancedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearchChange(value)
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Switch
            id="instock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onFilterChange("inStockOnly", checked)}
          />
          <Label htmlFor="instock">In Stock Only</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label>Sort by</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="stock">Availability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Order</Label>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => onFilterChange("sortOrder", value)}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={onReset} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          {/* Price Range */}
          <div className="space-y-2">
            <Label>Price Range: ৳{filters.minPrice.toLocaleString()} - ৳{filters.maxPrice.toLocaleString()}</Label>
            <Slider
              defaultValue={[filters.minPrice, filters.maxPrice]}
              min={0}
              max={500000}
              step={1000}
              onValueChange={(value) => {
                onFilterChange("minPrice", value[0])
                onFilterChange("maxPrice", value[1])
              }}
              className="w-full"
            />
          </div>

          {/* Brands Filter */}
          {availableBrands.length > 0 && (
            <div className="space-y-2">
              <Label>Brands</Label>
              <div className="flex flex-wrap gap-2">
                {availableBrands.slice(0, 10).map((brand) => (
                  <div key={brand} className="flex items-center gap-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={filters.selectedBrands.includes(brand)}
                      onCheckedChange={(checked) => {
                        const newBrands = checked
                          ? [...filters.selectedBrands, brand]
                          : filters.selectedBrands.filter((b: string) => b !== brand)
                        onFilterChange("selectedBrands", newBrands)
                      }}
                    />
                    <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                      {brand}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
