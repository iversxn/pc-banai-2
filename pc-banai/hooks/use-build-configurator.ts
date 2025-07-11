"use client"

import { useState, useCallback } from "react"
import type {
  BuildState,
  Component,
  ComponentSelection,
  CompatibilityCheck,
  CompatibilityWarning,
  CompatibilityError,
} from "@/types"
import { allComponents } from "@/data/components"

export function useBuildConfigurator() {
  const [buildState, setBuildState] = useState<BuildState>({
    components: {},
    totalPrice: 0,
    compatibility: { isCompatible: true, warnings: [], errors: [] },
    selectedRetailers: {},
    wattage: 0,
  })

  const calculateCompatibility = useCallback((components: ComponentSelection): CompatibilityCheck => {
    const warnings: CompatibilityWarning[] = []
    const errors: CompatibilityError[] = []

    // CPU + Motherboard socket compatibility
    if (components.cpu && components.motherboard) {
      if (components.cpu.socket !== components.motherboard.socket) {
        errors.push({
          type: "socket_mismatch",
          message: "CPU socket does not match motherboard socket",
          messageBengali: "সিপিইউ সকেট মাদারবোর্ড সকেটের সাথে মিলছে না",
          components: ["cpu", "motherboard"],
        })
      }
    }

    // RAM compatibility with motherboard
    if (components.ram && components.motherboard && components.ram.length > 0) {
      const ramType = components.ram[0].memoryType
      if (ramType !== components.motherboard.memoryType) {
        errors.push({
          type: "memory_type_mismatch",
          message: "RAM type does not match motherboard memory type",
          messageBengali: "র্যামের ধরন মাদারবোর্ডের মেমরি টাইপের সাথে মিলছে না",
          components: ["ram", "motherboard"],
        })
      }
    }

    // PSU wattage check
    const totalWattage = calculateWattage(components)
    if (components.psu) {
      const psuWattage = Number.parseInt(components.psu.specifications.wattage as string)
      if (totalWattage > psuWattage * 0.8) {
        // 80% rule
        warnings.push({
          type: "insufficient_power",
          message: `PSU may be insufficient. Required: ${totalWattage}W, Available: ${psuWattage}W`,
          messageBengali: `পিএসইউ অপর্যাপ্ত হতে পারে। প্রয়োজন: ${totalWattage}W, উপলব্ধ: ${psuWattage}W`,
          components: ["psu"],
        })
      }
    }

    // Case form factor compatibility
    if (components.case && components.motherboard) {
      const caseFormFactors = components.case.compatibility.formFactor || []
      const mbFormFactor = components.motherboard.formFactor
      if (!caseFormFactors.includes(mbFormFactor!)) {
        errors.push({
          type: "form_factor_mismatch",
          message: "Motherboard form factor not supported by case",
          messageBengali: "মাদারবোর্ডের ফর্ম ফ্যাক্টর কেস দ্বারা সমর্থিত নয়",
          components: ["case", "motherboard"],
        })
      }
    }

    return {
      isCompatible: errors.length === 0,
      warnings,
      errors,
    }
  }, [])

  const calculateWattage = useCallback((components: ComponentSelection): number => {
    let totalWattage = 0

    Object.values(components).forEach((component) => {
      if (Array.isArray(component)) {
        component.forEach((comp) => {
          totalWattage += comp.powerConsumption || 0
        })
      } else if (component) {
        totalWattage += component.powerConsumption || 0
      }
    })

    return totalWattage
  }, [])

  const calculateTotalPrice = useCallback((components: ComponentSelection): number => {
    let totalPrice = 0

    Object.values(components).forEach((component) => {
      if (Array.isArray(component)) {
        component.forEach((comp) => {
          const lowestPrice = Math.min(...comp.prices.map((p) => p.price))
          totalPrice += lowestPrice
        })
      } else if (component) {
        const lowestPrice = Math.min(...component.prices.map((p) => p.price))
        totalPrice += lowestPrice
      }
    })

    return totalPrice
  }, [])

  const updateComponent = useCallback(
    (category: keyof ComponentSelection, component: Component | Component[] | null) => {
      setBuildState((prev) => {
        const newComponents = { ...prev.components }

        if (component === null) {
          delete newComponents[category]
        } else {
          newComponents[category] = component as any
        }

        const totalPrice = calculateTotalPrice(newComponents)
        const compatibility = calculateCompatibility(newComponents)
        const wattage = calculateWattage(newComponents)

        return {
          ...prev,
          components: newComponents,
          totalPrice,
          compatibility,
          wattage,
        }
      })
    },
    [calculateTotalPrice, calculateCompatibility, calculateWattage],
  )

  const clearBuild = useCallback(() => {
    setBuildState({
      components: {},
      totalPrice: 0,
      compatibility: { isCompatible: true, warnings: [], errors: [] },
      selectedRetailers: {},
      wattage: 0,
    })
  }, [])

  const getCompatibleComponents = useCallback(
    (category: keyof ComponentSelection): Component[] => {
      const categoryComponents = allComponents.filter((c) => c.category === category)

      // Apply compatibility filters based on current build
      return categoryComponents.filter((component) => {
        // CPU compatibility with motherboard
        if (category === "cpu" && buildState.components.motherboard) {
          return component.socket === buildState.components.motherboard.socket
        }

        // Motherboard compatibility with CPU
        if (category === "motherboard" && buildState.components.cpu) {
          return component.socket === buildState.components.cpu.socket
        }

        // RAM compatibility with motherboard
        if (category === "ram" && buildState.components.motherboard) {
          return component.memoryType === buildState.components.motherboard.memoryType
        }

        return true
      })
    },
    [buildState.components],
  )

  return {
    buildState,
    updateComponent,
    clearBuild,
    getCompatibleComponents,
    allComponents,
  }
}
