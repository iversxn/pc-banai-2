"use client"

import React, { useMemo } from "react"

type Item = {
  id?: string | number
  name?: string
  brand?: string | null
  [k: string]: any
}

interface Props {
  initialItems?: Item[] | null
  onBrandSelect?: (brand: string | null) => void
  selectedBrand?: string | null
}

/**
 * CategoryBrowserClient
 *
 * - Derives unique brand list from `initialItems`
 * - Defensive: works when `initialItems` is undefined/null
 * - Avoids calling the Set as a function (use s.add)
 */
export default function CategoryBrowserClient({
  initialItems,
  onBrandSelect,
  selectedBrand = null,
}: Props) {
  const brands = useMemo(() => {
    // defensive copy and ensure it's an array
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
      <h3 className="text-sm font-medium mb-2">Brands</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onBrandSelect?.(null)}
          className={`text-xs px-2 py-1 rounded-md border ${selectedBrand === null ? "bg-primary text-primary-foreground" : "bg-background"}`}
        >
          All
        </button>
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => onBrandSelect?.(b)}
            className={`text-xs px-2 py-1 rounded-md border ${selectedBrand === b ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            {b}
          </button>
        ))}
      </div>
    </aside>
  )
}
