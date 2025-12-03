import React from "react"

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
 * Helper: converts a mixed-price array into an array of numbers.
 * Keeps implementation tiny and robust so SWC/TS parser doesn't get confused.
 */
function toNumericPrices(prices?: PriceLike[] | null): number[] {
  if (!Array.isArray(prices)) return []
  const out: number[] = []
  for (const p of prices) {
    if (p == null) continue
    if (typeof p === "object") {
      const v = (p as any).price
      const n = Number(v)
      if (Number.isFinite(n)) out.push(n)
      continue
    }
    const n = Number(p as number | string)
    if (Number.isFinite(n)) out.push(n)
  }
  return out
}

/**
 * FunctionalBuildSummary
 *
 * Minimal, self-contained TSX component. No external imports (no Badge),
 * so parsing can't fail due to import resolution. This keeps things small
 * and ensures it will compile.
 */
export default function FunctionalBuildSummary({ items }: Props) {
  const list = Array.isArray(items) ? items : []

  return (
    <div style={{ display: "block", gap: 8 }}>
      {list.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280" }}>No builds available.</div>
      ) : (
        list.map((comp) => {
          const name = comp?.name ?? "Unnamed"
          const category = comp?.category ?? "Uncategorized"
          const prices = toNumericPrices(comp?.prices)
          const minPrice = prices.length ? Math.min(...prices) : 0

          return (
            <div
              key={comp?.id ?? `${name}-${category}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 12, color: "#4B5563" }}>{category}</div>
              </div>

              <div style={{ fontSize: 12, border: "1px solid #E5E7EB", padding: "4px 8px", borderRadius: 6 }}>
                ৳{minPrice.toLocaleString()}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
