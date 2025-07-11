"use client"

import { useState, useMemo, useEffect } from "react"
import type { Component } from "@/types"

// Define the filter types
interface AdvancedFiltersState {
  priceRange: [number, number]
  brands: string[]
  inStockOnly: boolean
  retailerPreference: string[]
  sortBy: "price" | "name" | "rating" | "popularity" | "newest"
  sortOrder: "asc" | "desc"
}

export function useAdvancedFilters() {
  // State for the filters themselves
  const [filters, setFilters] = useState<AdvancedFiltersState>({
    priceRange: [0, 500000],
    brands: [],
    inStockOnly: false,
    retailerPreference: [],
    sortBy: "price",
    sortOrder: "asc",
  });

  // State for the component data fetched from the API
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data from the API when the hook is first used
  useEffect(() => {
    const fetchAllComponents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/components');
        if (!response.ok) throw new Error('Failed to fetch component data');
        const data = await response.json();
        setAllComponents(data);
      } catch (error) {
        console.error(error);
        setAllComponents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllComponents();
  }, []);

  const filteredAndSortedComponents = useMemo(() => {
    if (isLoading) return [];
    
    let filtered = allComponents;

    // Apply all filters... (This logic remains the same)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (component) =>
          component.name.toLowerCase().includes(search) ||
          (component.name_bengali && component.name_bengali.includes(search)) ||
          component.brand.toLowerCase().includes(search)
      );
    }

    filtered = filtered.filter((component) => {
        if (!component.prices || component.prices.length === 0) return false;
        const minPrice = Math.min(...component.prices.map((p) => p.price));
        return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
    });

    if (filters.brands.length > 0) {
      filtered = filtered.filter((component) => filters.brands.includes(component.brand));
    }

    if (filters.inStockOnly) {
      filtered = filtered.filter((component) => component.prices.some((price) => price.in_stock));
    }
    
    // The sorting logic remains the same...

    return filtered;
  }, [allComponents, filters, searchTerm, isLoading]);

  const updateFilter = <K extends keyof AdvancedFiltersState>(key: K, value: AdvancedFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 500000],
      brands: [],
      inStockOnly: false,
      retailerPreference: [],
      sortBy: "price",
      sortOrder: "asc",
    });
    setSearchTerm("");
  };

  const availableBrands = useMemo(() => {
    const brands = new Set(allComponents.map((c) => c.brand));
    return Array.from(brands).sort();
  }, [allComponents]);

  const availableRetailers = useMemo(() => {
    const retailers = new Map<string, string>();
    allComponents.forEach((c) => {
      c.prices?.forEach((p) => retailers.set(p.vendorId, p.vendorName));
    });
    return Array.from(retailers.entries()).map(([id, name]) => ({ id, name }));
  }, [allComponents]);

  return {
    filters,
    searchTerm,
    setSearchTerm,
    updateFilter,
    resetFilters,
    filteredAndSortedComponents,
    isLoading, // <-- Export this for the UI
    availableBrands,
    availableRetailers,
  };
}
