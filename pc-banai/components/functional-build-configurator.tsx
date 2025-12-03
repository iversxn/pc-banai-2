"use client"

import React, { useMemo, useState } from "react"
import { FunctionalComponentSelector, SelectedComponent } from "./functional-component-selector"
import { FunctionalCompatibilityChecker } from "./functional-compatibility-checker"
import FunctionalBuildSummary from "./functional-build-summary"
import { Cpu, HardDrive, MemoryStick } from "lucide-react"

/**
 * FunctionalBuildConfigurator
 *
 * Client component (uses useState/useMemo). Imports named exports
 * above and passes `selected` directly to the compatibility checker.
 */

type SelectedRecord = Record<string, SelectedComponent | null>

export default function FunctionalBuildConfigurator() {
  const [selected, setSelected] = useState<SelectedRecord>({})

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
    <div id="build-configurator" className="w-full flex flex-col lg:flex-row gap-4">
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
          <FunctionalComponentSelector selected={selected} onSelect={onSelect} />
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
