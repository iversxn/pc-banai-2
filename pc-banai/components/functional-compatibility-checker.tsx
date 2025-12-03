"use client"

import React from "react"
import type { SelectedComponent } from "./functional-component-selector"

export type CompatibilityError = {
  type: string
  message: string
  components?: string[]
}

interface Props {
  selected: Record<string, SelectedComponent | null>
}

/**
 * FunctionalCompatibilityChecker
 *
 * Accepts the same `selected` record that the configurator passes.
 * Produces a small list of errors/warnings (synchronous, deterministic).
 *
 * Keeps implementation compact and typed to avoid build/time surprises.
 */
export function FunctionalCompatibilityChecker({ selected }: Props) {
  const errors: CompatibilityError[] = []
  const warnings: CompatibilityError[] = []

  const get = (k: string) => selected[k] ?? null

  const cpu = get("cpu")
  const motherboard = get("motherboard")
  const ram = get("ram")
  const psu = get("psu")
  const pcCase = get("case")

  // Check socket mismatch (CPU vs motherboard)
  if (cpu && motherboard) {
    const cpuSocket = (cpu as any).socket ?? (cpu as any).socket_raw ?? null
    const mbSocket = (motherboard as any).socket ?? (motherboard as any).socket_raw ?? null
    if (cpuSocket && mbSocket) {
      if (String(cpuSocket).trim() !== String(mbSocket).trim()) {
        errors.push({
          type: "socket_mismatch",
          message: `CPU socket (${cpuSocket}) does not match motherboard socket (${mbSocket}).`,
          components: ["cpu", "motherboard"],
        })
      }
    } else {
      warnings.push({
        type: "socket_unknown",
        message: "Socket information for CPU or motherboard is missing; cannot guarantee compatibility.",
        components: ["cpu", "motherboard"],
      })
    }
  }

  // RAM type check (very simple): if motherboard has 'supportedRam' or 'ram_type' key attempt to compare
  if (ram && motherboard) {
    const ramType = (ram as any).type ?? (ram as any).ramType ?? null
    const mbRamType = (motherboard as any).ram_type ?? (motherboard as any).supportedRam ?? null
    if (ramType && mbRamType) {
      if (!String(mbRamType).toLowerCase().includes(String(ramType).toLowerCase())) {
        warnings.push({
          type: "ram_type_mismatch",
          message: `Selected RAM (${ramType}) may not be supported by the motherboard (${mbRamType}).`,
          components: ["ram", "motherboard"],
        })
      }
    }
  }

  // PSU presence check (warn if no PSU and there is a discrete GPU selected)
  const gpu = get("gpu")
  if (!psu && gpu) {
    warnings.push({
      type: "psu_missing",
      message: "No PSU selected while a GPU is chosen — ensure your PSU can handle GPU power draw.",
      components: ["psu", "gpu"],
    })
  }

  // Case / cooler fit check (simple heuristic)
  if (pcCase && cpu) {
    const pcCaseSize = (pcCase as any).form_factor ?? (pcCase as any).size ?? null
    const mbFactor = (motherboard as any).form_factor ?? (motherboard as any).size ?? null
    if (pcCaseSize && mbFactor && String(pcCaseSize) !== String(mbFactor)) {
      warnings.push({
        type: "case_mb_size",
        message: `Case size (${pcCaseSize}) may not fit motherboard size (${mbFactor}).`,
        components: ["case", "motherboard"],
      })
    }
  }

  // If nothing found, show success note
  const isOk = errors.length === 0

  return (
    <div className="p-3 border rounded-md">
      <div className="mb-2">
        <strong>Compatibility Check</strong>
      </div>

      {!isOk && (
        <div className="mb-3 text-sm">
          <div style={{ color: "#b91c1c", marginBottom: 6 }}>Errors</div>
          <ul style={{ paddingLeft: 18 }}>
            {errors.map((e) => (
              <li key={e.type} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{e.message}</div>
                {e.components && <div style={{ fontSize: 12, color: "#374151" }}>Related: {e.components.join(", ")}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-3 text-sm">
          <div style={{ color: "#92400e", marginBottom: 6 }}>Warnings</div>
          <ul style={{ paddingLeft: 18 }}>
            {warnings.map((w) => (
              <li key={w.type} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{w.message}</div>
                {w.components && <div style={{ fontSize: 12, color: "#374151" }}>Related: {w.components.join(", ")}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOk && warnings.length === 0 && (
        <div style={{ color: "#065f46", fontWeight: 600 }}>No compatibility problems detected.</div>
      )}

      {isOk && warnings.length > 0 && <div style={{ color: "#0a3d3d", fontWeight: 600 }}>No blocking errors found — review warnings.</div>}
    </div>
  )
}
