"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Component } from "@/types"

interface Props {
  category: string
  components: Component[]
  selectedComponents?: Component | Component[]
  onSelect: (component: Component) => void
  onRemove: (id: string, category: any) => void
}

export function FunctionalComponentSelector({
  category,
  components,
  selectedComponents,
  onSelect,
  onRemove,
}: Props) {
  const isSelected = (component: Component) => {
    if (Array.isArray(selectedComponents)) {
      return selectedComponents.some((c) => c.id === component.id)
    }
    return selectedComponents?.id === component.id
  }

  return (
    <div className="space-y-3">
      {components.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No compatible components found
          <div className="text-xs">কোন সামঞ্জস্যপূর্ণ কম্পোনেন্ট পাওয়া যায়নি</div>
        </div>
      ) : (
        components.map((c) => {
          const valid = c.prices?.filter((p) => (p.price || 0) > 0 && p.inStock) || []
          const best = valid.length ? Math.min(...valid.map((p) => p.price)) : 0
          const bestVendor = valid.find((p) => p.price === best)

          return (
            <Card
              key={c.id}
              className={`transition ${isSelected(c) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow"} `}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {c.images?.[0] && (
                    <img
                      src={c.images[0]}
                      alt={c.name}
                      className="h-16 w-16 object-contain rounded border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{c.name}</h3>
                      {c.brand && <Badge variant="outline">{c.brand}</Badge>}
                      {c.socket && <Badge variant="secondary">Socket: {c.socket}</Badge>}
                      {c.memoryType && <Badge variant="secondary">{c.memoryType}</Badge>}
                      {c.formFactor && <Badge variant="secondary">{c.formFactor}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {c.specifications?.summary}
                    </div>

                    <div className="mt-3 space-y-1">
                      {/* Price list per retailer */}
                      {(c.prices || []).map((p, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.retailerName}</span>
                            {p.productUrl && (
                              <a
                                href={p.productUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            )}
                          </div>
                          <div className={`font-semibold ${p.inStock && p.price > 0 ? "text-green-600" : "text-red-500"}`}>
                            {p.inStock && p.price > 0 ? `৳${p.price.toLocaleString()}` : "Out of Stock"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {isSelected(c) ? (
                      <Button
                        variant="outline"
                        onClick={() => onRemove(c.id, c.category as any)}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button onClick={() => onSelect(c)}>Select</Button>
                    )}
                    {best > 0 && (
                      <div className="text-xs text-right text-muted-foreground">
                        Best: <span className="font-semibold text-green-600">৳{best.toLocaleString()}</span>{" "}
                        {bestVendor ? `@ ${bestVendor.retailerName}` : ""}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
