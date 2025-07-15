"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Component } from "@/types"
import { Star, TrendingDown, TrendingUp } from "lucide-react"

interface ComponentSelectorProps {
  category: string
  components: Component[]
  selectedComponent?: Component | Component[]
  onSelect: (component: Component | null) => void
}

export function ComponentSelector({ category, components, selectedComponent, onSelect }: ComponentSelectorProps) {
  const isSelected = (component: Component) => {
    if (Array.isArray(selectedComponent)) {
      return selectedComponent.some((c) => c.id === component.id)
    }
    return selectedComponent?.id === component.id
  }

  return (
    <div className="space-y-4">
      {components.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No compatible components found</p>
          <p className="text-sm">কোন সামঞ্জস্যপূর্ণ কম্পোনেন্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        components.map((component) => {
          const validPrices = component.prices.filter(p => p.price > 0)
          const bestPrice = validPrices.length ? Math.min(...validPrices.map((p) => p.price)) : 0
          const bestRetailer = component.prices.find(p => p.price === bestPrice)

          return (
            <Card
              key={component.id}
              className={`cursor-pointer transition-all ${isSelected(component) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{component.name}</h3>
                      <Badge variant="outline">{component.brand}</Badge>
                    </div>
                    <p className="text-sm text-blue-600 mb-2">{component.nameBengali}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(component.specifications).slice(0, 3).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">{String(value)}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {bestPrice > 0 ? (
                          <div className="text-lg font-bold text-green-600">৳{bestPrice.toLocaleString()}</div>
                        ) : (
                          <div className="text-lg font-bold text-red-600">Out of Stock</div>
                        )}
                        {bestRetailer && (
                          <div className="text-xs text-gray-500">
                            at {bestRetailer.retailerName}
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{bestRetailer.rating}</span>
                              {bestRetailer.trend === "down" && <TrendingDown className="h-3 w-3 text-green-600" />}
                              {bestRetailer.trend === "up" && <TrendingUp className="h-3 w-3 text-red-600" />}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected(component) ? "default" : "outline"}
                        onClick={() => onSelect(isSelected(component) ? null : component)}
                      >
                        {isSelected(component) ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  )
}
