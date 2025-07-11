"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Component, BuildState, ComponentSelection, CompatibilityCheck } from "@/types"

// REMOVED: No longer importing from a static file.
// import { allExpandedComponents } from "@/data/expanded-components"

export function useFunctionalBuildConfigurator() {
  // --- NEW: State for storing components fetched from the API ---
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Existing state management ---
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

  // --- NEW: Fetch data from the API when the hook is first used ---
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
        setAllComponents([]); // On error, set to empty to prevent crashes
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []); // Empty dependency array ensures this runs only once on mount.

  // --- The rest of the logic remains the same, but now uses the `allComponents` state ---

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
            wattage += item.power_consumption || 0;
        });
    });
    return wattage;
  }, []);

  const checkRealCompatibility = useCallback(
    (components: ComponentSelection): CompatibilityCheck => {
      const warnings: any[] = [];
      const errors: any[] = [];

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
        const ramType = components.ram[0].memory_type;
        if (ramType !== components.motherboard.memory_type) {
          errors.push({
            type: "memory_type_mismatch",
            message: `RAM type ${ramType} incompatible with motherboard memory type ${components.motherboard.memory_type}`,
            messageBengali: `র্যামের ধরন ${ramType} মাদারবোর্ডের মেমরি টাইপ ${components.motherboard.memory_type} এর সাথে সামঞ্জস্যপূর্ণ নয়`,
            components: ["ram", "motherboard"],
          });
        }
      }
      
      return { isCompatible: errors.length === 0, warnings, errors };
    },
    []
  );

  useEffect(() => {
    const newPrice = calculateRealPrice(selectedComponents);
    const newWattage = calculateRealWattage(selectedComponents);
    const newCompatibility = checkRealCompatibility(selectedComponents);

    setTotalPrice(newPrice);
    setTotalWattage(newWattage);
    setCompatibility(newCompatibility);
  }, [selectedComponents, calculateRealPrice, calculateRealWattage, checkRealCompatibility]);

  const selectComponent = useCallback((component: Component) => {
    // This function remains the same
    // ...
  }, []);
  
  const removeComponent = useCallback((componentId: string, category: keyof ComponentSelection) => {
    // This function remains the same
    // ...
  }, []);

  const clearBuild = useCallback(() => {
    // This function remains the same
    // ...
  }, []);

  const saveBuild = useCallback(() => {
    // This function remains the same
    // ...
  }, [selectedComponents, totalPrice, compatibility, totalWattage]);

  const getCompatibleComponents = useCallback(
    (category: keyof ComponentSelection): Component[] => {
      if (isLoading) return []; // Don't filter if data isn't ready

      const categoryComponents = allComponents.filter((c) => c.category === category);

      // The rest of the filtering logic is the same
      return categoryComponents.filter((component) => {
        if (category === "cpu" && selectedComponents.motherboard) {
          return component.socket === selectedComponents.motherboard.socket;
        }
        if (category === "motherboard" && selectedComponents.cpu) {
          return component.socket === selectedComponents.cpu.socket;
        }
        if (category === "ram" && selectedComponents.motherboard) {
          return component.memory_type === selectedComponents.motherboard.memory_type;
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
    isLoading, // <-- Export isLoading for the UI
    buildHistory,
    selectComponent,
    removeComponent,
    clearBuild,
    saveBuild,
    getCompatibleComponents,
  };
}
