"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, TrendingDown, TrendingUp, Star, ExternalLink } from "lucide-react"

// Add the import at the top
import { usePriceComparison } from "@/hooks/use-price-comparison"

// Replace the existing component content with functional implementation
export function PriceComparison() {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredComponents,
    getBestDeal,
    getRetailerComparison,
  } = usePriceComparison()

  return (
    <section id="price-comparison" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Real-time Price Comparison</h2>
          <p className="text-lg text-gray-600 mb-8">Compare prices across 25+ Bangladeshi retailers instantly</p>

          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredComponents.slice(0, 5).map((component) => (
            <Card key={component.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{component.name}</h3>
                    <Badge variant="outline">{component.category}</Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Set Price Alert
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Retailer</th>
                        <th className="text-left p-4 font-medium">Price</th>
                        <th className="text-left p-4 font-medium">Stock</th>
                        <th className="text-left p-4 font-medium">Rating</th>
                        <th className="text-left p-4 font-medium">Trend</th>
                        <th className="text-left p-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRetailerComparison(component).map((price, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{price.retailerName}</td>
                          <td className="p-4">
                            <span
                              className={`text-lg font-bold ${price.isBestDeal ? "text-green-600" : "text-gray-900"}`}
                            >
                              ৳{price.price.toLocaleString()}
                            </span>
                            {price.isBestDeal && <Badge className="ml-2 bg-green-100 text-green-800">Best Deal</Badge>}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={price.inStock ? "default" : "secondary"}
                              className={price.inStock ? "bg-green-100 text-green-800" : ""}
                            >
                              {price.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{price.rating}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {price.trend === "down" && <TrendingDown className="h-4 w-4 text-green-600" />}
                            {price.trend === "up" && <TrendingUp className="h-4 w-4 text-red-600" />}
                            {price.trend === "stable" && <div className="h-4 w-4 bg-gray-400 rounded-full"></div>}
                          </td>
                          <td className="p-4">
                            <Button size="sm" className="flex items-center gap-1" disabled={!price.inStock}>
                              Buy Now
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
