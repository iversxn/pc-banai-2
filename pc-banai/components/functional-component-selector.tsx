"use client"

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
  selected: Record<string, SelectedComponent | null>
  onSelect: (category: string, comp: SelectedComponent | null) => void
}

/**
 * FunctionalComponentSelector
 *
 * Minimal, fully-typed client component.
 * - Renders a compact set of categories and a small sample of options per category.
 * - Calls onSelect(category, component|null) when user selects/deselects.
 *
 * NOTE: This is intentionally small and robust (no external UI imports) to avoid build surprises.
 */
export function FunctionalComponentSelector({ selected, onSelect }: Props) {
  // Small static categories + sample options — your app can replace these with real API-driven data.
  const CATEGORIES: {
    key: string
    label: string
    options: SelectedComponent[]
  }[] = [
    {
      key: "cpu",
      label: "CPU",
      options: [
        { id: "cpu-amd-7800x3d", name: "AMD Ryzen 7 7800X3D", price: 85000, brand: "AMD", socket: "AM5" },
        { id: "cpu-intel-13700", name: "Intel Core i7-13700", price: 52000, brand: "Intel", socket: "LGA1700" },
      ],
    },
    {
      key: "motherboard",
      label: "Motherboard",
      options: [
        { id: "mb-am5-x670", name: "X670 Motherboard", price: 32000, brand: "MSI", socket: "AM5" },
        { id: "mb-lga1700-z690", name: "Z690 Motherboard", price: 24000, brand: "ASUS", socket: "LGA1700" },
      ],
    },
    {
      key: "ram",
      label: "RAM",
      options: [
        { id: "ram-32-ddr5", name: "32GB DDR5", price: 12000, brand: "Corsair", type: "DDR5" },
        { id: "ram-16-ddr4", name: "16GB DDR4", price: 5200, brand: "G.Skill", type: "DDR4" },
      ],
    },
  ]

  return (
    <div>
      {CATEGORIES.map((cat) => {
        const sel = selected[cat.key] ?? null
        return (
          <div key={cat.key} className="mb-4 border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <strong>{cat.label}</strong>
              <small className="text-xs text-gray-600">{sel ? sel.name : "No selection"}</small>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                className={`px-2 py-1 border rounded text-sm ${sel === null ? "bg-gray-100" : ""}`}
                onClick={() => onSelect(cat.key, null)}
                aria-label={`Clear ${cat.label}`}
                type="button"
              >
                Clear
              </button>

              {cat.options.map((opt) => {
                const isSelected = sel?.id === opt.id
                return (
                  <button
                    key={String(opt.id)}
                    className={`px-2 py-1 border rounded text-sm ${isSelected ? "bg-blue-600 text-white" : "bg-white"}`}
                    onClick={() => onSelect(cat.key, isSelected ? null : opt)}
                    type="button"
                    aria-pressed={isSelected}
                  >
                    <div style={{ fontSize: 12, lineHeight: 1 }}>{opt.name}</div>
                    <div style={{ fontSize: 11, color: "#4B5563" }}>৳{opt.price?.toLocaleString()}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
