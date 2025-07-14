import { NextResponse } from "next/server"
import supabase from "@/utils/supabaseClient"

const CATEGORY_TABLES: Record<string, string> = {
  cpu: "processors",
  gpu: "graphics_cards",
  motherboard: "motherboards",
  ram: "rams",
  storage: "ssd_drives", // HDD and SSD will be merged
  psu: "power_supplies",
  case: "casings",
  cooling: "cpu_coolers", // or casing_coolers depending on UI
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get("category")

  const categoriesToFetch = categoryParam
    ? [categoryParam]
    : Object.keys(CATEGORY_TABLES)

  const allComponents: any[] = []

  for (const category of categoriesToFetch) {
    const table = CATEGORY_TABLES[category]
    const { data, error } = await supabase.from(table).select("*")

    if (error) {
      console.error(`Failed to fetch ${category}:`, error)
      continue
    }

    const normalized = (data || []).map((item: any, index: number) => ({
      id: `${category}-${index}`,
      name: item.product_name,
      nameBengali: item.product_name,
      category,
      brand: item.brand,
      specifications: { summary: item.short_specs },
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
          rating: 0,
          trend: "stable",
+         productUrl: item.product_url,
        },
      ],
      compatibility: {},
      images: [item.image_url],
      powerConsumption: 0,
      socket: null,
      chipset: null,
      memoryType: null,
      formFactor: null,
      reviews: [],
    }))

    allComponents.push(...normalized)
  }

  return NextResponse.json(allComponents)
}
