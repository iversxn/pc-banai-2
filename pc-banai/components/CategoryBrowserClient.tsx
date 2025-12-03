"use client"

import React, { useMemo } from "react"

type Item = {
  id?: string | number
  product_name?: string | null
  brand?: string | null
  socket?: string | null
  specs?: Record<string, any> | null
  image?: string | null
  prices?: any
  category?: string | null
  socket_raw?: string | null
  [k: string]: any
}

interface Props {
  initialItems?: Item[] | null
  onBrandSelect?: (brand: string | null) => void
  selectedBrand?: string | null
  /**
   * `category` is optional because some uses may not provide it.
   * Page components were passing `category={slug}` so we accept it now.
   */
  category?: string | null
}

/**
 * CategoryBrowserClient
 *
 * - Accepts `category` prop (optional) so server pages can pass it.
 * - Derives unique brand list from `initialItems` safely.
 * - Minimal UI change: shows category title if provided.
 */
export default function CategoryBrowserClient({
  initialItems,
  onBrandSelect,
  selectedBrand = null,
  category = null,
}: Props) {
  const brands = useMemo(() => {
    const items = Array.isArray(initialItems) ? initialItems : []
    const s = new Set<string>()
    for (const it of items) {
      if (!it) continue
      const b = it.brand ?? null
      if (b && typeof b === "string" && b.trim().length > 0) s.add(b.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [initialItems])

  return (
    <aside className="p-4">
      {category ? (
        <h3 className="text-sm font-semibold mb-2">Category: {category}</h3>
      ) : (
        <h3 className="text-sm font-semibold mb-2">Brands</h3>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onBrandSelect?.(null)}
          aria-pressed={selectedBrand === null}
          className={`text-xs px-2 py-1 rounded-md border ${
            selectedBrand === null ? "bg-primary text-primary-foreground" : "bg-background"
          }`}
        >
          All
        </button>

        {brands.length === 0 ? (
          <span className="text-xs text-muted-foreground">No brands found</span>
        ) : (
          brands.map((b) => (
            <button
              key={b}
              onClick={() => onBrandSelect?.(b)}
              aria-pressed={selectedBrand === b}
              className={`text-xs px-2 py-1 rounded-md border ${
                selectedBrand === b ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              {b}
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
