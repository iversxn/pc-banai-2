import React from "react"
import { Badge } from "./ui/badge" // adjust path if your project places Badge elsewhere

type PriceLike = number | string | { price?: number | string } | null | undefined

type FunctionalComp = {
  id?: string | number
  name?: string | null
  category?: string | null
  prices?: PriceLike[] | null
  [k: string]: any
}

interface Props {
  items?: FunctionalComp[] | null
}

/**
 * Convert varied price shapes into a numeric array.
 * Explicitly types the callback params to avoid implicit any.
 */
function extractNumericPrices(prices: PriceLike[] | null | undefined): number[] {
  if (!Array.isArray(prices)) return []
  const numeric = prices
    .map((p: PriceLike) => {
      if (p == null) return NaN
      if (typeof p === "object" && "price" in (p as any)) {
        const v = (p as any).price
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      const n = Number(p as number | string)
      return Number.isFinite(n) ? n : NaN
    })
    .filter((n) => Number.isFinite(n))
    .map((n) => n as number)

  return numeric
}

/**
 * functional-build-summary
 *
 * - Default export component
 * - Renders a list of items with the minimum price shown in a Badge
 * - Defensive: works with missing/invalid price data
 */
export default function FunctionalBuildSummary({ items }: Props) {
  const list = Array.isArray(items) ? items : []

  return (
    <section className="space-y-3">
      {list.length === 0 ? (
        <div className="text-sm text-muted-foreground">No builds available.</div>
      ) : (
        list.map((comp) => {
          const name = comp?.name ?? "Unnamed"
          const category = comp?.category ?? "Uncategorized"
          const prices = extractNumericPrices(comp?.prices)
          const minPrice = prices.length ? Math.min(...prices) : 0

          return (
            <div
              key={comp?.id ?? `${name}-${category}`}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <div className="flex flex-col">
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs text-gray-600">{category}</div>
              </div>

              <Badge variant="outline" className="text-xs">
                ৳{minPrice.toLocaleString()}
              </Badge>
            </div>
          )
        })
      )}
    </
