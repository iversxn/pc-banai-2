// pc-banai/hooks/use-functional-build-configurator.ts
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
        const res = await fetch("/api/components")
        if (!res.ok) throw new Error("Failed to load components")
        const data = await res.json()
        setAllComponents(data || [])
      } catch (e) {
        console.error("Failed to fetch components:", e)
        setAllComponents([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchComponents()
  }, [])

  const onlyInStock = useCallback(
    (list: Component[]) => {
      if (!showInStockOnly) return list
      return list.filter((c) => c.prices?.some((p) => (p?.price || 0) > 0 && p.inStock))
    },
    [showInStockOnly]
  )

  const sortByStock = useCallback(
    (list: Component[]) => {
      if (stockSort === "none") return list
      const clone = [...list]
      const score = (c: Component) => (c.prices?.some((p) => (p?.price || 0) > 0 && p.inStock) ? 1 : 0)
      clone.sort((a, b) => (stockSort === "in-first" ? score(b) - score(a) : score(a) - score(b)))
      return clone
    },
    [stockSort]
  )

  const calculateTotalPrice = useCallback((components: ComponentSelection): number => {
    let total = 0
    Object.values(components).forEach((c) => {
      const arr = Array.isArray(c) ? c : [c]
      arr.forEach((item) => {
        const valid = item.prices?.filter((p) => (p.price || 0) > 0) || []
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

    if (cpu && motherboard) {
      if (cpu.socket && motherboard.socket) {
        if (cpu.socket !== motherboard.socket) {
          errors.push({
            type: "socket_mismatch",
            message: `CPU socket (${cpu.socket}) is not compatible with motherboard socket (${motherboard.socket}).`,
            messageBengali: `সিপিইউ সকেট (${cpu.socket}) মাদারবোর্ড সকেট (${motherboard.socket}) এর সাথে সামঞ্জস্যপূর্ণ নয়।`,
            components: ["cpu", "motherboard"],
          })
        }
      } else {
        warnings.push({
          type: "socket_unknown",
          message: "Socket info missing for CPU or motherboard; compatibility cannot be guaranteed.",
          messageBengali: "সিপিইউ বা মাদারবোর্ডের সকেট তথ্য নেই; সামঞ্জস্য নিশ্চিত করা যাচ্ছে না।",
          components: ["cpu", "motherboard"],
        })
      }
    }

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
        if (!existing.some((x) => x.id === component.id)) next[cat] = [...existing, component]
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
        const filtered = current.filter((c) => c.id !== componentId)
        next[category] = filtered.length > 0 ? filtered : undefined
      } else if (current?.id === componentId) {
        delete next[category]
      }
      return next
    })
  }, [])

  const clearBuild = useCallback(() => setSelectedComponents({}), [])

  const saveBuild = useCallback(() => {
    const build: BuildState = {
      components: selectedComponents,
      totalPrice,
      compatibility,
      wattage: totalWattage,
      selectedRetailers: {},
    }
    setBuildHistory((prev) => [build, ...prev])
    const encoded = btoa(JSON.stringify(selectedComponents))
    const url = `${window.location.origin}/build?data=${encoded}`
    navigator.clipboard.writeText(url)
    return url
  }, [selectedComponents, totalPrice, compatibility, totalWattage])

  // pick-up logic: if another page requested add via localStorage (Category page writes key)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("pc-banai:add")
      if (!raw) return
      const payload = JSON.parse(raw)
      const item = payload?.item ?? payload
      if (item && typeof item === "object") {
        // ensure item has category (some scrapers might use product_name)
        if (!item.category && payload?.category) item.category = payload.category
        selectComponent(item as Component)
      }
      localStorage.removeItem("pc-banai:add")
    } catch (e) {
      // ignore
    }
  }, [selectComponent])

  const getCompatibleComponents = useCallback((category: keyof ComponentSelection): Component[] => {
    let list = allComponents.filter((c) => c.category === category)

    const cpu = selectedComponents.cpu
    const mb = selectedComponents.motherboard

    if (category === "motherboard") {
      if (cpu?.socket) {
        // if CPU socket present → only motherboards matching that socket pass
        list = list.filter((m) => !m.socket ? false : m.socket === cpu.socket)
      }
    }

    if (category === "cpu") {
      if (mb?.socket) {
        list = list.filter((c) => !c.socket ? false : c.socket === mb.socket)
      }
    }

    // in-stock + sort
    list = onlyInStock(list)
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
