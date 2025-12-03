import React from "react"
import { Badge } from "@/components/ui/badge"

type PriceLike = number | string | { price?: number | string } | null | undefined

type Comp = {
  id?: string | number
  name?: string
  category?: string | null
  prices?: PriceLike[] | null
  [k: string]: any
}

interface Props {
  /** List of components/builds to summarize */
  components?: Comp[] | null
}

/**
 * Helper to compute numeric prices array from various shapes.
 * Explicitly types the map callback to avoid implicit any in strict TS.
 */
function extractNumericPrices(prices: PriceLike[] | null | undefined): number[] {
  if (!Array.isArray(prices)) return []
  const numeric = prices
    .map((p: PriceLike) => {
      if (p == null) return NaN
      // if it's an object with a price field, use that
      if (typeof p === "object" && "price" in (p as any)) {
        const v = (p as any).price
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      // otherwise try to coerce directly (number or numeric string)
      const n = Number(p as number | string)
      return Number.isFinite(n) ? n : NaN
    })
    .filter((n) => Number.isFinite(n))
    // TypeScript now knows these are numbers
    .map((n) => n as number)

  return numeric
}

export default function BuildSummary({ components }: Props) {
  const comps = Array.isArray(components) ? components : []

  return (
    <section className="space-y-3">
      {comps.length === 0 ? (
        <div className="text-sm text-muted-foreground">No builds found.</div>
      ) : (
        comps.map((comp) => {
          const category = comp?.category ?? "Uncategorized"
          const prices = extractNumericPrices(comp?.prices)
          const minPrice = prices.length ? Math.min(...prices) : 0

          return (
            <div key={comp?.id ?? comp?.name ?? Math.random()} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex flex-col">
                <div className="text-sm font-medium">{comp?.name ?? "Unnamed build"}</div>
                <div className="text-xs text-gray-600">{category}</div>
              </div>

              <Badge variant="outline">
                ৳{minPrice.toLocaleString()}
              </Badge>
            </div>
          )
        })
      )}
    </section>
  )
}
