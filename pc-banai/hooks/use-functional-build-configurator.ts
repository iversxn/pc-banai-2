// pc-banai/hooks/use-functional-build-configurator.ts

"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Component, BuildState, ComponentSelection, CompatibilityCheck, CompatibilityError, CompatibilityWarning } from "@/types"

export function useFunctionalBuildConfigurator() {
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/components');
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        setAllComponents(data);
      } catch (error) {
        console.error("Failed to fetch components:", error);
        setAllComponents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComponents();
  }, []);

  const calculateRealPrice = useCallback((components: ComponentSelection): number => {
    let total = 0
    Object.values(components).forEach((component) => {
      if (!component) return;
      const items = Array.isArray(component) ? component : [component];
      items.forEach((item) => {
        if (item.prices && item.prices.length > 0) {
          const bestPrice = Math.min(...item.prices.map((p) => p.price));
          total += bestPrice;
        }
      });
    });
    return total;
  }, []);

  const calculateRealWattage = useCallback((components: ComponentSelection): number => {
    let wattage = 0
    Object.values(components).forEach((component) => {
        if (!component) return;
        const items = Array.isArray(component) ? component : [component];
        items.forEach((item) => {
            wattage += item.powerConsumption || 0;
        });
    });
    return wattage;
  }, []);

  const checkRealCompatibility = useCallback(
    (components: ComponentSelection): CompatibilityCheck => {
      const warnings: CompatibilityWarning[] = [];
      const errors: CompatibilityError[] = [];

      if (components.cpu && components.motherboard) {
        if (components.cpu.socket !== components.motherboard.socket) {
          errors.push({
            type: "socket_mismatch",
            message: `CPU socket ${components.cpu.socket} incompatible with motherboard socket ${components.motherboard.socket}`,
            messageBengali: `সিপিইউ সকেট ${components.cpu.socket} মাদারবোর্ড সকেট ${components.motherboard.socket} এর সাথে সামঞ্জস্যপূর্ণ নয়`,
            components: ["cpu", "motherboard"],
          });
        }
      }

      if (components.ram && components.motherboard && Array.isArray(components.ram) && components.ram.length > 0) {
        const ramType = components.ram[0].memoryType;
        if (ramType !== components.motherboard.memoryType) {
          errors.push({
            type: "memory_type_mismatch",
            message: `RAM type ${ramType} incompatible with motherboard memory type ${components.motherboard.memoryType}`,
            messageBengali: `র্যামের ধরন ${ramType} মাদারবোর্ডের মেমরি টাইপ ${components.motherboard.memoryType} এর সাথে সামঞ্জস্যপূর্ণ নয়`,
            components: ["ram", "motherboard"],
          });
        }
      }
      
      return { isCompatible: errors.length === 0, warnings, errors };
    },
    []
  );

  useEffect(() => {
    setIsCalculating(true);
    const newPrice = calculateRealPrice(selectedComponents);
    const newWattage = calculateRealWattage(selectedComponents);
    const newCompatibility = checkRealCompatibility(selectedComponents);

    setTotalPrice(newPrice);
    setTotalWattage(newWattage);
    setCompatibility(newCompatibility);
    setIsCalculating(false);
  }, [selectedComponents, calculateRealPrice, calculateRealWattage, checkRealCompatibility]);

  const selectComponent = useCallback((component: Component) => {
    setSelectedComponents((prev) => {
      const newSelection = { ...prev };
      const category = component.category as keyof ComponentSelection;

      if (category === "ram" || category === "storage") {
        const existing = (newSelection[category] as Component[]) || [];
        if (!existing.some(c => c.id === component.id)) {
          newSelection[category] = [...existing, component];
        }
      } else {
        newSelection[category] = component;
      }
      return newSelection;
    });
  }, []);

  const removeComponent = useCallback((componentId: string, category: keyof ComponentSelection) => {
    setSelectedComponents((prev) => {
      const newSelection = { ...prev };
      const componentInCategory = newSelection[category];

      if (Array.isArray(componentInCategory)) {
        const updatedCategory = componentInCategory.filter(c => c.id !== componentId);
        if (updatedCategory.length > 0) {
          newSelection[category] = updatedCategory;
        } else {
          delete newSelection[category];
        }
      } else {
        if (componentInCategory?.id === componentId) {
          delete newSelection[category];
        }
      }
      return newSelection;
    });
  }, []);

  const clearBuild = useCallback(() => {
    setSelectedComponents({});
  }, []);

  const saveBuild = useCallback(() => {
    const buildToSave: BuildState = {
      components: selectedComponents,
      totalPrice,
      compatibility,
      wattage: totalWattage,
      selectedRetailers: {},
    };
    setBuildHistory((prev) => [buildToSave, ...prev]);
    const buildUrl = btoa(JSON.stringify(selectedComponents));
    const shareUrl = `${window.location.origin}/build?data=${buildUrl}`;
    navigator.clipboard.writeText(shareUrl);
    return shareUrl;
  }, [selectedComponents, totalPrice, compatibility, totalWattage]);

  const getCompatibleComponents = useCallback(
    (category: keyof ComponentSelection): Component[] => {
      if (isLoading) return [];

      const categoryComponents = allComponents.filter((c) => c.category === category);

      return categoryComponents.filter((component) => {
        if (category === "cpu" && selectedComponents.motherboard) {
          return component.socket === selectedComponents.motherboard.socket;
        }
        if (category === "motherboard" && selectedComponents.cpu) {
          return component.socket === selectedComponents.cpu.socket;
        }
        if (category === "ram" && selectedComponents.motherboard) {
          return component.memoryType === selectedComponents.motherboard.memoryType;
        }
        return true;
      });
    },
    [isLoading, allComponents, selectedComponents]
  );

  const buildState: BuildState = useMemo(
    () => ({
      components: selectedComponents,
      totalPrice,
      compatibility,
      selectedRetailers: {},
      wattage: totalWattage,
    }),
    [selectedComponents, totalPrice, compatibility, totalWattage]
  );

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
  };
}
