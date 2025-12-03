import React, { useMemo, useState } from "react"
import { ComponentSelector } from "./component-selector"
import { CompatibilityChecker } from "./compatibility-checker"
import BuildSummary from "./build-summary"
import { Cpu, HardDrive, MemoryStick } from "lucide-react"

/**
 * BuildConfigurator
 *
 * - Imports ComponentSelector and CompatibilityChecker as named exports
 *   because those modules export named components.
 * - BuildSummary is imported as default (matches its default export).
 * - Minimal, safe composition, preserving UI and behavior.
 */

type SelectedComponent = {
  id?: string | number
  name?: string
  category?: string
  brand?: string
  price?: number
  [k: string]: any
}

export default function BuildConfigurator() {
  const [selected, setSelected] = useState<Record<string, SelectedComponent | null>>({})

  const onSelect = (category: string, comp: SelectedComponent | null) => {
    setSelected((prev) => ({ ...prev, [category]: comp }))
  }

  const componentsForSummary = useMemo(() => {
    return Object.keys(selected).map((k) => {
      const s = selected[k]
      return {
        id: s?.id ?? k,
        name: s?.name ?? `No ${k}`,
        category: k,
        prices: s?.price != null ? [s.price] : [],
      }
    })
  }, [selected])

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-2/3 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Build Configurator</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Cpu size={14} /> CPU</span>
            <span className="inline-flex items-center gap-1"><MemoryStick size={14} /> RAM</span>
            <span className="inline-flex items-center gap-1"><HardDrive size={14} /> Storage</span>
          </div>
        </header>

        <section>
          <ComponentSelector onSelect={onSelect} selected={selected} />
        </section>

        <section>
          <CompatibilityChecker selected={selected} />
        </section>
      </div>

      <aside className="w-full lg:w-1/3">
        <div className="sticky top-6">
          <h3 className="text-sm font-medium mb-2">Build Summary</h3>
          <BuildSummary components={componentsForSummary} />
        </div>
      </aside>
    </div>
  )
}
