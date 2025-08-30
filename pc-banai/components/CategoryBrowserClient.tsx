// components/CategoryBrowserClient.tsx
"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PriceEntry {
  retailer: string
  price: number
  inStock: boolean
  productUrl?: string | null
}

interface Item {
  id: string
  product_name: string
  brand?: string
  socket?: string | null
  specs?: string
  image?: string | null
  prices?: PriceEntry[]
  category?: string
}

export default function CategoryBrowserClient({
  initialItems,
  category,
}: {
  initialItems: Item[]
  category: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState<string>("all")

  // derive brand list
  const brands = useMemo(() => {
    const s = new Set<string>()
    (initialItems || []).forEach((it) => {
      if (it.brand) s.add(it.brand)
    })
    return Array.from(s).sort()
  }, [initialItems])

  const filtered = useMemo(() => {
    return (initialItems || [])
      .filter((it) => it.product_name.toLowerCase().includes(search.toLowerCase()))
      .filter((it) => (brandFilter === "all" ? true : (it.brand || "").toLowerCase() === (brandFilter || "").toLowerCase()))
  }, [initialItems, search, brandFilter])

  function handleAddToBuild(item: Item) {
    // store the full item for the builder to pick up after navigation
    try {
      localStorage.setItem("pc-banai:add", JSON.stringify({ item, category }))
    } catch (e) {
      console.warn("could not store add-to-build", e)
    }
    router.push("/build")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
        <Input
          placeholder={`Search ${category}...`}
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          className="w-full md:w-1/2"
        />

        <Select value={brandFilter} onValueChange={(v) => setBrandFilter(v)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div>No components found</div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const validPrices = (it.prices || []).filter((p) => (p?.price || 0) > 0 && p.inStock)
            const bestPrice = validPrices.length ? Math.min(...validPrices.map((p) => p.price)) : 0
            return (
              <Card key={it.id} className="hover:shadow-md transition">
                <CardHeader>
                  <div className="flex justify-between items-center w-full">
                    <CardTitle className="text-sm">{it.product_name}</CardTitle>
                    {it.brand && <Badge variant="outline">{it.brand}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {it.image && (
                    <img src={it.image} alt={it.product_name} className="h-28 w-full object-contain" />
                  )}

                  {it.socket && <div className="text-xs text-muted-foreground">Socket: {it.socket}</div>}
                  {it.specs && <div className="text-xs text-muted-foreground line-clamp-3">{it.specs}</div>}

                  <div className="mt-2 space-y-1">
                    {(it.prices || []).map((p, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{p.retailer}</span>
                          {p.productUrl && (
                            <a href={p.productUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600">
                              View
                            </a>
                          )}
                        </div>
                        <div className={`${p.inStock && p.price > 0 ? "text-green-600" : "text-red-500"} font-semibold`}>
                          {p.inStock && p.price > 0 ? `৳${p.price.toLocaleString()}` : "Out of Stock"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <Button onClick={() => handleAddToBuild(it)}>Add to Build</Button>
                    {bestPrice > 0 ? (
                      <div className="text-sm text-green-600 font-semibold">Best: ৳{bestPrice.toLocaleString()}</div>
                    ) : (
                      <div className="text-sm text-red-500 font-semibold">Out of Stock</div>
                    )}
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
