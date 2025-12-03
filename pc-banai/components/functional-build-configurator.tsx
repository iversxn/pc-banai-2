import React, { useMemo, useState } from "react"
import { FunctionalComponentSelector } from "./functional-component-selector"
import { FunctionalCompatibilityChecker } from "./functional-compatibility-checker"
import FunctionalBuildSummary from "./functional-build-summary"
import { Cpu, HardDrive, MemoryStick } from "lucide-react"

/**
 * FunctionalBuildConfigurator
 *
 * - Uses named imports for FunctionalComponentSelector and FunctionalCompatibilityChecker.
 * - Uses default import for FunctionalBuildSummary (matches its default export).
 * - Minimal, typed, and defensive to avoid further import/type issues.
 */

type SelectedComponent = {
  id?: string | number
  name?: string
  category?: string
  price?: number
  brand?: string
  [k: string]: any
}

export default function FunctionalBuildConfigurator() {
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
          <h2 className="text-lg font-semibold">Functional Build Configurator</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Cpu size={14} /> CPU</span>
            <span className="inline-flex items-center gap-1"><MemoryStick size={14} /> RAM</span>
            <span className="inline-flex items-center gap-1"><HardDrive size={14} /> Storage</span>
          </div>
        </header>

        <section>
          <FunctionalComponentSelector onSelect={onSelect} selected={selected} />
        </section>

        <section>
          <FunctionalCompatibilityChecker selected={selected} />
        </section>
      </div>

      <aside className="w-full lg:w-1/3">
        <div className="sticky top-6">
          <h3 className="text-sm font-medium mb-2">Build Summary</h3>
          <FunctionalBuildSummary items={componentsForSummary} />
        </div>
      </aside>
    </div>
  )
}
