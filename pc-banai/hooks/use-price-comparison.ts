"use client"

import { useState, useMemo, useEffect } from "react"
import type { Component, Price } from "@/types"

// REMOVED: No longer importing from a static file.
// import { allExpandedComponents } from "@/data/expanded-components"

export function usePriceComparison() {
  // --- NEW: State for API data and loading status ---
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Existing state ---
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all")

  // --- NEW: Fetch data from the API ---
  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/components');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAllComponents(data);
      } catch (error) {
        console.error("Failed to fetch components for price comparison:", error);
        setAllComponents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComponents();
  }, []); // Empty dependency array ensures this runs only once.

  const filteredComponents = useMemo(() => {
    if (isLoading) {
      return []; // Return an empty array while data is loading
    }
    
    let components = allComponents;

    if (selectedCategory !== "all") {
      components = components.filter((c) => c.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      components = components.filter(
        (component) =>
          component.name.toLowerCase().includes(search) ||
          (component.brand && component.brand.toLowerCase().includes(search)) ||
          (component.name_bengali && component.name_bengali.toLowerCase().includes(search))
      );
    }

    return components;
  }, [isLoading, allComponents, searchTerm, selectedCategory]);

  const getBestDeal = (component: Component): Price | undefined => {
    if (!component.prices || component.prices.length === 0) {
      return undefined;
    }
    return component.prices.reduce((best, current) => {
      if (!best || current.price < best.price) {
        return current;
      }
      return best;
    }, undefined as Price | undefined);
  };

  const getRetailerComparison = (component: Component) => {
    const bestPrice = getBestDeal(component)?.price;
    if (!component.prices) {
      return [];
    }
    return component.prices
      .map((price) => ({
        ...price,
        isBestDeal: price.price === bestPrice,
      }))
      .sort((a, b) => a.price - b.price);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredComponents,
    isLoading, // <-- Export isLoading for the UI
    getBestDeal,
    getRetailerComparison,
  };
}
