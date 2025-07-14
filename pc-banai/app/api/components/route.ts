// pc-banai/app/api/components/route.ts

import { NextResponse } from "next/server";
import supabase from "@/utils/supabaseClient";

const CATEGORY_TABLES: Record<string, string> = {
  cpu: "processors",
  gpu: "graphics_cards",
  motherboard: "motherboards",
  ram: "rams",
  storage: "ssd_drives",
  psu: "power_supplies",
  case: "casings",
  cooling: "cpu_coolers",
};

// --- Data Parsing Helpers ---
const findSpec = (specs: string, key: string): string | null => {
  const regex = new RegExp(`${key}[^:]*:\\s*([^|]+)`, 'i');
  const match = specs.match(regex);
  if (match && match[1]) {
    return match[1].split(',')[0].trim();
  }
  return null;
};

const parseWattage = (specs: string, name: string): number => {
  const combinedText = `${specs.toLowerCase()} ${name.toLowerCase()}`;
  const wattageMatch = combinedText.match(/(\d+)\s*w/);
  if (wattageMatch && wattageMatch[1]) {
    const watts = parseInt(wattageMatch[1], 10);
    if (watts > 10 && watts < 3000) {
      return watts;
    }
  }
  return 0;
};

const parseMemoryType = (specs: string): string | null => {
  const lowerSpecs = specs.toLowerCase();
  if (lowerSpecs.includes("ddr5")) return "DDR5";
  if (lowerSpecs.includes("ddr4")) return "DDR4";
  if (lowerSpecs.includes("ddr3")) return "DDR3";
  return null;
};

const parseFormFactor = (specs: string): string[] => {
    const lowerSpecs = specs.toLowerCase();
    const factors: string[] = [];
    if (lowerSpecs.includes("atx")) factors.push("ATX");
    if (lowerSpecs.includes("micro-atx") || lowerSpecs.includes("micro atx")) factors.push("Micro-ATX");
    if (lowerSpecs.includes("mini-itx") || lowerSpecs.includes("mini itx")) factors.push("Mini-ITX");
    return factors;
}

const estimatePowerConsumption = (category: string, name: string): number => {
    const lowerName = name.toLowerCase();
    if (category === 'cpu') {
        if (lowerName.includes('i9') || lowerName.includes('ryzen 9')) return 150;
        if (lowerName.includes('i7') || lowerName.includes('ryzen 7')) return 125;
        if (lowerName.includes('i5') || lowerName.includes('ryzen 5')) return 95;
        if (lowerName.includes('i3') || lowerName.includes('ryzen 3')) return 65;
        return 80;
    }
    if (category === 'gpu') {
        if (lowerName.includes('4090') || lowerName.includes('7900 xtx')) return 450;
        if (lowerName.includes('4080') || lowerName.includes('7900 xt')) return 320;
        if (lowerName.includes('4070') || lowerName.includes('7800 xt')) return 250;
        if (lowerName.includes('4060') || lowerName.includes('7700 xt')) return 160;
        return 200;
    }
    if (category === 'ram' || category === 'storage') return 10;
    return 0;
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");

  const categoriesToFetch = categoryParam
    ? [categoryParam]
    : Object.keys(CATEGORY_TABLES);

  const allComponents: any[] = [];

  for (const category of categoriesToFetch) {
    const table = CATEGORY_TABLES[category];
    if (!table) continue;

    const { data, error } = await supabase.from(table).select("*");

    if (error) {
      console.error(`Failed to fetch ${category}:`, error);
      continue;
    }

    const normalized = (data || []).map((item: any, index: number) => {
      const specs = item.short_specs || "";
      const name = item.product_name || "";

      const socket = findSpec(specs, 'Socket');
      const memoryType = parseMemoryType(specs);
      const formFactor = parseFormFactor(specs);
      const chipset = findSpec(specs, 'Chipset');
      
      let psuWattage = 0;
      if (category === 'psu') {
          psuWattage = parseWattage(specs, name);
      }

      return {
        id: `${category}-${item.id}`,
        name: name,
        nameBengali: name,
        category,
        brand: item.brand,
        specifications: {
          summary: specs,
          ...(category === 'psu' && { wattage: psuWattage }),
        },
        prices: [
          {
            retailerId: "startech",
            retailerName: "StarTech",
            price: parseInt(item.price_bdt) || 0,
            currency: "BDT",
            inStock: item.availability?.toLowerCase() !== "out of stock",
            lastUpdated: new Date(),
            shippingCost: 0,
            warranty: "N/A",
            rating: 5,
            trend: "stable",
            productUrl: item.product_url,
          },
        ],
        compatibility: {
          socket: socket,
          chipset: chipset ? [chipset] : [],
          memoryType: memoryType ? [memoryType] : [],
          formFactor: formFactor,
        },
        images: [item.image_url],
        powerConsumption: estimatePowerConsumption(category, name),
        socket: socket,
        chipset: chipset,
        memoryType: memoryType,
        formFactor: formFactor.length > 0 ? formFactor[0] : null,
        reviews: [],
      };
    });

    allComponents.push(...normalized);
  }

  return NextResponse.json(allComponents);
}
