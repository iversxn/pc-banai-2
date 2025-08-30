"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  type Component,
  type BuildState,
  type ComponentSelection,
  type CompatibilityCheck,
  type CompatibilityError,
  type CompatibilityWarning,
} from "@/types"

export function useFunctionalBuildConfigurator() {
  const [allComponents, setAllComponents] = useState<Component[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedComponents, setSelectedComponents] = useState<ComponentSelection>({})
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalWattage, setTotalWattage] = useState(0)
  const [compatibility, setCompatibility] = useState<CompatibilityCheck>({
    isCompatible: true,
    warnings: [],
    errors: [],
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [buildHistory, setBuildHistory] = useState<BuildState[]>([])
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [stockSort, setStockSort] = useState<"none" | "in-first" | "out-first">("none")

  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/components", { next: { revalidate: 1800 } })
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
        const data = await response.json()
        setAllComponents(data)
      } catch (error) {
        console.error("Failed to fetch components:", error)
        setAllComponents([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchComponents()
  }, [])

  const onlyInStock = useCallback((list: Component[]) => {
    if (!showInStockOnly) return list
    return list.filter((c) => c.prices?.some((p) => (p?.price || 0) > 0 && p.inStock))
  }, [showInStockOnly])

  const sortByStock = useCallback((list: Component[]) => {
    if (stockSort === "none") return list
    const clone = [...list]
    const score = (c: Component) => c.prices?.some((p) => (p?.price || 0) > 0 && p.inStock) ? 1 : 0
    clone.sort((a, b) => stockSort === "in-first" ? score(b) - score(a) : score(a) - score(b))
    return clone
  }, [stockSort])

  const calculateTotalPrice = useCallback((components: ComponentSelection): number => {
    let total = 0
    Object.values(components).forEach((item) => {
      const arr = Array.isArray(item) ? item : [item]
      arr.forEach((c) => {
        const valid = c.prices?.filter((p) => (p.price || 0) > 0) || []
        if (valid.length) total += Math.min(...valid.map((p) => p.price))
      })
    })
    return total
  }, [])

  const calculateTotalWattage = useCallback((components: ComponentSelection): number => {
    let wattage = 0
    Object.values(components).forEach((c) => {
      const arr = Array.isArray(c) ? c : [c]
      arr.forEach((item) => {
        wattage += item?.powerConsumption || 0
      })
    })
    return wattage
  }, [])

  const checkCompatibility = useCallback((components: ComponentSelection): CompatibilityCheck => {
    const errors: CompatibilityError[] = []
    const warnings: CompatibilityWarning[] = []
    const { cpu, motherboard, ram, psu, case: pcCase } = components

    // CPU ↔ Motherboard socket
    if (cpu && motherboard && cpu.socket && motherboard.socket && cpu.socket !== motherboard.socket) {
      errors.push({
        type: "socket_mismatch",
        message: `CPU socket (${cpu.socket}) is not compatible with motherboard socket (${motherboard.socket}).`,
        messageBengali: `সিপিইউ সকেট (${cpu.socket}) মাদারবোর্ড সকেট (${motherboard.socket}) এর সাথে সামঞ্জস্যপূর্ণ নয়।`,
        components: ["cpu", "motherboard"],
      })
    }

    // RAM ↔ Motherboard memory type
    if (ram && ram.length > 0 && motherboard?.memoryType) {
      ram.forEach((r) => {
        if (r.memoryType && r.memoryType !== motherboard.memoryType) {
          errors.push({
            type: "memory_type_mismatch",
            message: `RAM type (${r.memoryType}) not compatible with motherboard memory (${motherboard.memoryType}).`,
            messageBengali: `র্যাম টাইপ (${r.memoryType}) মাদারবোর্ডের মেমোরি টাইপ (${motherboard.memoryType}) এর সাথে সামঞ্জস্যপূর্ণ নয়।`,
            components: ["ram", "motherboard"],
          })
        }
      })
    }

    // Motherboard ↔ Case form factor
    if (motherboard?.formFactor && pcCase?.compatibility?.formFactor) {
      if (!pcCase.compatibility.formFactor.includes(motherboard.formFactor)) {
        errors.push({
          type: "form_factor_mismatch",
          message: `Motherboard form factor (${motherboard.formFactor}) may not fit in case.`,
          messageBengali: `মাদারবোর্ড ফর্ম ফ্যাক্টর (${motherboard.formFactor}) কেসে ফিট নাও হতে পারে।`,
          components: ["motherboard", "case"],
        })
      }
    }

    // PSU wattage
    const requiredWattage = calculateTotalWattage(components)
    if (psu?.specifications?.wattage) {
      const available = psu.specifications.wattage as number
      if (requiredWattage > available) {
        errors.push({
          type: "insufficient_power",
          message: `PSU capacity (${available}W) < required (${requiredWattage}W).`,
          messageBengali: `পিএসইউ ক্ষমতা (${available}W) অপর্যাপ্ত (${requiredWattage}W)।`,
          components: ["psu"],
        })
      } else if (requiredWattage > available * 0.85) {
        warnings.push({
          type: "power_supply_warning",
          message: `Build is near PSU's limit. Consider higher wattage.`,
          messageBengali: `পিএসইউ এর সীমার কাছাকাছি। বেশি ওয়াটেজ বিবেচনা করুন।`,
          components: ["psu"],
        })
      }
    } else if (requiredWattage > 0) {
      warnings.push({
        type: "psu_missing",
        message: "No PSU selected, but power is needed.",
        messageBengali: "PSU নির্বাচন করা হয়নি, কিন্তু পাওয়ার প্রয়োজন আছে।",
        components: ["psu"],
      })
    }

    return { isCompatible: errors.length === 0, errors, warnings }
  }, [calculateTotalWattage])

  useEffect(() => {
    setIsCalculating(true)
    setTotalPrice(calculateTotalPrice(selectedComponents))
    setTotalWattage(calculateTotalWattage(selectedComponents))
    setCompatibility(checkCompatibility(selectedComponents))
    setIsCalculating(false)
  }, [selectedComponents, calculateTotalPrice, calculateTotalWattage, checkCompatibility])

  const selectComponent = useCallback((component: Component) => {
    setSelectedComponents((prev) => {
      const next = { ...prev }
      const cat = component.category as keyof ComponentSelection
      if (cat === "ram" || cat === "storage") {
        const existing = Array.isArray(next[cat]) ? next[cat] : []
        // prevent duplicates
        if (!existing.some((x) => x.id === component.id)) {
          next[cat] = [...existing, component]
        }
      } else {
        next[cat] = component
      }
      return next
    })
  }, [])

  const removeComponent = useCallback((componentId: string, category: keyof ComponentSelection) => {
    setSelectedComponents((prev) => {
      const next = { ...prev }
      const current = next[category]
      if (Array.isArray(current)) {
        next[category] = current.filter((c) => c.id !== componentId)
        if ((next[category] as any[])?.length === 0) delete next[category]
      } else if (current?.id === componentId) {
        delete next[category]
      }
      return next
    })
  }, [])

  const clearBuild = useCallback(() => setSelectedComponents({}), [])

  const saveBuild = useCallback(() => {
    const buildToSave: BuildState = {
      components: selectedComponents,
      totalPrice,
      compatibility,
      wattage: totalWattage,
      selectedRetailers: {},
    }
    setBuildHistory((prev) => [buildToSave, ...prev])
    const encoded = btoa(JSON.stringify(selectedComponents))
    const url = `${window.location.origin}/build?data=${encoded}`
    navigator.clipboard.writeText(url)
    return url
  }, [selectedComponents, totalPrice, compatibility, totalWattage])

  // the *fixed* compatibility lookups
  const getCompatibleComponents = useCallback((category: keyof ComponentSelection): Component[] => {
    let list = allComponents.filter((c) => c.category === category)

    const cpu = selectedComponents.cpu
    const mb = selectedComponents.motherboard

    if (category === "motherboard") {
      if (cpu?.socket) {
        list = list.filter((c) => !cpu.socket || !c.socket ? true : c.socket === cpu.socket)
      }
    }

    if (category === "cpu") {
      if (mb?.socket) {
        list = list.filter((c) => !mb.socket || !c.socket ? true : c.socket === mb.socket)
      }
    }

    // availability filter
    list = onlyInStock(list)
    // stock sort
    list = sortByStock(list)

    return list
  }, [allComponents, selectedComponents, onlyInStock, sortByStock])

  const buildState: BuildState = useMemo(
    () => ({
      components: selectedComponents,
      totalPrice,
      compatibility,
      selectedRetailers: {},
      wattage: totalWattage,
    }),
    [selectedComponents, totalPrice, compatibility, totalWattage]
  )

  return {
    buildState,
    selectedComponents,
    totalPrice,
    totalWattage,
    compatibility,
    isCalculating,
    isLoading,
    buildHistory,
    selectComponent,
    removeComponent,
    clearBuild,
    saveBuild,
    getCompatibleComponents,
    showInStockOnly,
    setShowInStockOnly,
    stockSort,
    setStockSort,
  }
}
