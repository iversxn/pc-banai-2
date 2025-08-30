// app/components/[category]/page.tsx
"use client"

import { useState, useMemo } from "react"
import supabase from "@/utils/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export const revalidate = 1800 // ISR: 30 minutes

// Fetcher (runs server-side at build + ISR revalidate)
async function getComponents(category: string) {
  const { data, error } = await supabase
    .from("components")
    .select("id, name, brand, socket, specs, prices")
    .eq("category", category)

  if (error) {
    console.error("Supabase fetch error:", error)
    return []
  }
  return data || []
}

// ✅ Main page
export default async function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const { category } = params
  const components = await getComponents(category)

  return <CategoryBrowser category={category} initialComponents={components} />
}

// ✅ Client Component for interactivity
function CategoryBrowser({
  category,
  initialComponents,
}: {
  category: string
  initialComponents: any[]
}) {
  const [search, setSearch] = useState("")
  const [brand, setBrand] = useState("all")

  // Dynamic brand options
  const brands = useMemo(() => {
    const b = Array.from(new Set(initialComponents.map((c) => c.brand))).filter(Boolean)
    return b.sort()
  }, [initialComponents])

  // Filtered results
  const filtered = useMemo(() => {
    return initialComponents.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchesBrand = brand === "all" || (c.brand && c.brand.toLowerCase() === brand.toLowerCase())
      return matchesSearch && matchesBrand
    })
  }, [search, brand, initialComponents])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 capitalize">{category}</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder={`Search ${category}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2"
        />

        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-[200px]">
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

      {/* Grid of Components */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No components found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((comp) => (
            <Card key={comp.id} className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{comp.name}</span>
                  {comp.brand && <Badge variant="secondary">{comp.brand}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Socket info for CPUs & Motherboards */}
                {comp.socket && (
                  <p className="text-sm text-muted-foreground mb-2">Socket: {comp.socket}</p>
                )}

                {/* Show specs preview */}
                {comp.specs && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{comp.specs}</p>
                )}

                {/* Price comparison */}
                {comp.prices && comp.prices.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {comp.prices.map((p: any, i: number) => (
                      <p key={i} className="text-sm">
                        <span className="font-medium">৳{p.price.toLocaleString()}</span> •{" "}
                        <span className="text-muted-foreground">{p.vendor}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-500">Out of stock</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
