// pc-banai/hooks/use-functional-build-configurator.ts

"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { type Component, type BuildState, type ComponentSelection, type CompatibilityCheck, type CompatibilityError, type CompatibilityWarning } from "@/types"

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

  const calculateTotalPrice = useCallback((components: ComponentSelection): number => {
    let total = 0;
    Object.values(components).forEach((componentOrArray) => {
      if (!componentOrArray) return;
      const items = Array.isArray(componentOrArray) ? componentOrArray : [componentOrArray];
      items.forEach((item) => {
        if (item.prices && item.prices.length > 0) {
          const bestPrice = Math.min(...item.prices.map((p) => p.price));
          total += bestPrice;
        }
      });
    });
    return total;
  }, []);

  const calculateTotalWattage = useCallback((components: ComponentSelection): number => {
    let wattage = 0;
    Object.values(components).forEach((componentOrArray) => {
      if (!componentOrArray) return;
      const items = Array.isArray(componentOrArray) ? componentOrArray : [componentOrArray];
      items.forEach((item) => {
        wattage += item.powerConsumption || 0;
      });
    });
    return wattage;
  }, []);

  const checkCompatibility = useCallback(
    (components: ComponentSelection): CompatibilityCheck => {
      const errors: CompatibilityError[] = [];
      const warnings: CompatibilityWarning[] = [];
      const { cpu, motherboard, ram, psu, case: pcCase } = components;

      // 1. CPU and Motherboard Socket
      if (cpu && motherboard && cpu.socket && motherboard.socket && cpu.socket !== motherboard.socket) {
        errors.push({
          type: "socket_mismatch",
          message: `CPU socket (${cpu.socket}) is not compatible with motherboard socket (${motherboard.socket}).`,
          messageBengali: `সিপিইউ সকেট (${cpu.socket}) মাদারবোর্ড সকেট (${motherboard.socket}) এর সাথে সামঞ্জস্যপূর্ণ নয়।`,
          components: ["cpu", "motherboard"],
        });
      }

      // 2. RAM and Motherboard Memory Type
      if (ram && ram.length > 0 && motherboard && motherboard.memoryType) {
        ram.forEach(ramStick => {
          if (ramStick.memoryType && ramStick.memoryType !== motherboard.memoryType) {
            errors.push({
              type: "memory_type_mismatch",
              message: `RAM type (${ramStick.memoryType}) is not compatible with motherboard memory type (${motherboard.memoryType}).`,
              messageBengali: `র্যামের ধরন (${ramStick.memoryType}) মাদারবোর্ডের মেমরি টাইপ (${motherboard.memoryType}) এর সাথে সামঞ্জস্যপূর্ণ নয়।`,
              components: ["ram", "motherboard"],
            });
          }
        });
      }
      
      // 3. Motherboard and Case Form Factor
      if (motherboard && pcCase && motherboard.formFactor && pcCase.compatibility?.formFactor) {
        if (!pcCase.compatibility.formFactor.some(factor => factor === motherboard.formFactor)) {
            errors.push({
                type: 'form_factor_mismatch',
                message: `Motherboard form factor (${motherboard.formFactor}) may not fit in the selected case.`,
                messageBengali: `মাদারবোর্ডের ফর্ম ফ্যাক্টর (${motherboard.formFactor}) নির্বাচিত কেসে ফিট নাও হতে পারে।`,
                components: ['motherboard', 'case'],
            });
        }
      }

      // 4. PSU Wattage Warning
      const requiredWattage = calculateTotalWattage(components);
      if (psu && psu.specifications.wattage) {
        const psuCapacity = psu.specifications.wattage as number;
        if (requiredWattage > psuCapacity) {
          errors.push({
            type: 'insufficient_power',
            message: `PSU capacity (${psuCapacity}W) is less than the estimated requirement (${requiredWattage}W).`,
            messageBengali: `পিএসইউ ক্ষমতা (${psuCapacity}W) আনুমানিক প্রয়োজনীয়তা (${requiredWattage}W) থেকে কম।`,
            components: ['psu'],
          });
        } else if (requiredWattage > psuCapacity * 0.85) {
          warnings.push({
            type: 'power_supply_warning',
            message: `Build is close to the PSU's limit (${psuCapacity}W). A higher wattage PSU is recommended for future upgrades.`,
            messageBengali: `বিল্ডটি পিএসইউ এর ক্ষমতার (${psuCapacity}W) কাছাকাছি। ভবিষ্যতের আপগ্রেডের জন্য উচ্চ ওয়াটের পিএসইউ সুপারিশ করা হচ্ছে।`,
            components: ['psu'],
          });
        }
      } else if (requiredWattage > 0) {
          warnings.push({
              type: 'psu_missing',
              message: 'A Power Supply Unit (PSU) has not been selected.',
              messageBengali: 'পাওয়ার সাপ্লাই ইউনিট (পিএসইউ) নির্বাচন করা হয়নি।',
              components: ['psu'],
          });
      }

      return { isCompatible: errors.length === 0, errors, warnings };
    },
    [calculateTotalWattage]
  );

  useEffect(() => {
    setIsCalculating(true);
    const newPrice = calculateTotalPrice(selectedComponents);
    const newWattage = calculateTotalWattage(selectedComponents);
    const newCompatibility = checkCompatibility(selectedComponents);

    setTotalPrice(newPrice);
    setTotalWattage(newWattage);
    setCompatibility(newCompatibility);
    setIsCalculating(false);
  }, [selectedComponents, calculateTotalPrice, calculateTotalWattage, checkCompatibility]);

  const selectComponent = useCallback((component: Component) => {
    setSelectedComponents(prev => {
      const newSelection = { ...prev };
      const category = component.category as keyof ComponentSelection;
      if (category === 'ram' || category === 'storage') {
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
    setSelectedComponents(prev => {
      const newSelection = { ...prev };
      const current = newSelection[category];
      if (Array.isArray(current)) {
        const filtered = current.filter(c => c.id !== componentId);
        newSelection[category] = filtered.length > 0 ? filtered : undefined;
      } else if (current?.id === componentId) {
        delete newSelection[category];
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

  const getCompatibleComponents = (category: string): Component[] => {
  if (category === "motherboard" && selectedComponents.cpu) {
    const cpuSocket = selectedComponents.cpu.socket
    return allComponents
      .filter((c) => c.category === "motherboard")
      .filter((mb) => mb.socket && cpuSocket && mb.socket === cpuSocket)
  }

  if (category === "cpu" && selectedComponents.motherboard) {
    const mbSocket = selectedComponents.motherboard.socket
    return allComponents
      .filter((c) => c.category === "cpu")
      .filter((cpu) => cpu.socket && mbSocket && cpu.socket === mbSocket)
  }

  return allComponents.filter((c) => c.category === category)
}

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
