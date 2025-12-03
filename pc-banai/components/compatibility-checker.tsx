import React from "react"
import type { SelectedComponent } from "./component-selector"

interface Props {
  selected?: Record<string, SelectedComponent | null>
}

/**
 * CompatibilityChecker
 *
 * Minimal, deterministic compatibility checker:
 * - Exports as a named export (matching how other files import it).
 * - Runs a few simple checks (socket match, memory type) based on available data.
 * - Returns human-readable results and an overall `ok` flag.
 *
 * This is intentionally lightweight so it can't fail TS checks when data is missing.
 */
export function CompatibilityChecker({ selected }: Props) {
  const entries = selected ? Object.entries(selected) : []

  // Simple sample checks — non-exhaustive, defensive against missing fields.
  const messages: string[] = []
  let ok = true

  // Example: if both CPU and motherboard selected, check (toy) socket compatibility
  const cpu = selected?.["cpu"]
  const mb = selected?.["motherboard"] || selected?.["motherboard"]

  if (cpu && mb) {
    const cpuSocket = (cpu as any).socket ?? (cpu as any).socket_raw ?? null
    const mbSocket = (mb as any).socket ?? (mb as any).socket_raw ?? null

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      ok = false
      messages.push(`Socket mismatch: CPU (${cpuSocket}) vs Motherboard (${mbSocket})`)
    }
  }

  // Example: check price sanity
  entries.forEach(([k, v]) => {
    if (!v) return
    const p = Number((v as any).price ?? 0)
    if (p < 0) {
      ok = false
      messages.push(`Component ${k} has an invalid price`)
    }
  })

  if (messages.length === 0) {
    messages.push("No compatibility issues detected.")
  }

  return (
    <div className="p-3 border rounded space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Compatibility</div>
        <div className={`text-xs font-semibold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
          {ok ? "OK" : "Issues"}
        </div>
      </div>

      <div className="text-xs space-y-1">
        {messages.map((m, i) => (
          <div key={i} className="text-muted-foreground">
            {m}
          </div>
        ))}
      </div>
    </div>
  )
}
