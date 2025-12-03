import React from "react"

export type SelectedComponent = {
  id?: string | number
  name?: string
  category?: string
  price?: number
  brand?: string
  [k: string]: any
}

interface Props {
  /**
   * onSelect(category, component|null)
   * - component === null means "clear selection" for that category
   */
  onSelect: (category: string, comp: SelectedComponent | null) => void
  /**
   * Current selected record keyed by category
   */
  selected?: Record<string, SelectedComponent | null>
}

/**
 * ComponentSelector
 *
 * Minimal, robust selector UI used by BuildConfigurator.
 * - Exports as a named export (matching how other files import it).
 * - Renders a short list of example categories and example choices.
 * - Keeps responsibilities small so type-checking stays simple.
 */
export function ComponentSelector({ onSelect, selected }: Props) {
  // Example categories and sample options.
  // This component intentionally uses a tiny static dataset so it won't rely on
  // external state or fetches — it's meant to be a stable UI contract.
  const categories = [
    {
      key: "cpu",
      label: "CPU",
      options: [
        { id: "cpu-i5", name: "Intel i5 13600K", price: 270 },
        { id: "cpu-r5", name: "AMD Ryzen 5 7600X", price: 240 },
      ],
    },
    {
      key: "motherboard",
      label: "Motherboard",
      options: [
        { id: "mb-a", name: "B650 Motherboard", price: 130 },
        { id: "mb-b", name: "Z790 Motherboard", price: 220 },
      ],
    },
    {
      key: "ram",
      label: "RAM",
      options: [
        { id: "ram-16", name: "16GB DDR5", price: 80 },
        { id: "ram-32", name: "32GB DDR5", price: 150 },
      ],
    },
  ]

  const handleSelect = (categoryKey: string, opt: SelectedComponent) => {
    onSelect(categoryKey, {
      id: opt.id,
      name: opt.name,
      category: categoryKey,
      price: opt.price,
      brand: opt.brand ?? undefined,
    })
  }

  const handleClear = (categoryKey: string) => {
    onSelect(categoryKey, null)
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.key} className="p-3 border rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">{cat.label}</div>
            <button
              type="button"
              onClick={() => handleClear(cat.key)}
              className="text-xs text-muted-foreground"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {cat.options.map((opt) => {
              const isSelected = selected?.[cat.key]?.id === opt.id
              return (
                <button
                  key={String(opt.id)}
                  onClick={() => handleSelect(cat.key, opt)}
                  className={`px-2 py-1 text-xs rounded border ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-background"
                  }`}
                >
                  <div className="whitespace-nowrap">{opt.name}</div>
                  <div className="text-[10px] opacity-80">৳{Number(opt.price).toLocaleString()}</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
