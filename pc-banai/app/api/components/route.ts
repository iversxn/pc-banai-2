import { NextResponse } from "next/server"
import supabase from "@/utils/supabaseClient"

export const revalidate = 1800 // 30 minutes

const RETAILERS = {
  startech: { id: "startech", name: "StarTech", tableSuffix: null },
  techland: { id: "techland", name: "Techland BD", tableSuffix: "_techland" },
  ultratech: { id: "ultratech", name: "Ultratech BD", tableSuffix: "_ultratech" },
  skyland: { id: "skyland", name: "Skyland BD", tableSuffix: "_skyland" },
} as const

const BASE_CATEGORY_TABLES: Record<string, string> = {
  cpu: "processors",
  motherboard: "motherboards",
  ram: "rams",
  gpu: "graphics_cards",
  storage_ssd: "ssd_drives",
  storage_hdd: "hdds",
  psu: "power_supplies",
  case: "casings",
  cooling_cpu: "cpu_coolers",
  cooling_case: "casing_coolers",
}

function normalizeRow(categoryKey: string, row: any, retailer: { id: string; name: string }) {
  const priceStr = String(row.price_bdt || "0")
  const priceNumber = Number(priceStr.replace(/[^0-9]/g, "")) || 0
  const inStockFlag = priceNumber > 0 ||
    (row.availability && String(row.availability).toLowerCase().includes("in stock"))

  const prices = [
    {
      retailerId: retailer.id,
      retailerName: retailer.name,
      price: priceNumber,
      currency: "BDT",
      inStock: inStockFlag,
      productUrl: row.product_url || undefined,
      lastUpdated: new Date(),
      shippingCost: 0,
      warranty: "",
      rating: 0,
      trend: "stable" as const,
    },
  ]

  const categoryMap: Record<string, string> = {
    cpu: "cpu",
    motherboard: "motherboard",
    ram: "ram",
    gpu: "gpu",
    storage_ssd: "storage",
    storage_hdd: "storage",
    psu: "psu",
    case: "case",
    cooling_cpu: "cooling",
    cooling_case: "cooling",
  }

  return {
    id: `${categoryKey}-${retailer.id}-${row.id || row.product_url || row.product_name}`,
    name: row.product_name || "Unknown",
    nameBengali: row.product_name || "অজানা",
    brand: row.brand || "N/A",
    category: categoryMap[categoryKey] || categoryKey,
    specifications: { summary: row.short_specs || "" },
    compatibility: {},
    prices,
    images: row.image_url ? [row.image_url] : [],
    powerConsumption: Number(row.power_consumption || 0) || 0,
    socket: row.socket || null,
    memoryType: row.memory_type || null,
    formFactor: row.form_factor || null,
    reviews: [],
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get("category")

    const categoryKeys = categoryParam
      ? Object.keys(BASE_CATEGORY_TABLES).filter((k) => {
          const mapped: Record<string, string[]> = {
            cpu: ["cpu"],
            motherboard: ["motherboard"],
            ram: ["ram"],
            gpu: ["gpu"],
            storage: ["storage_ssd", "storage_hdd"],
            psu: ["psu"],
            case: ["case"],
            cooling: ["cooling_cpu", "cooling_case"],
          }

          return mapped[categoryParam]?.includes(k)
        })
      : Object.keys(BASE_CATEGORY_TABLES)

    const results: any[] = []

    for (const key of categoryKeys) {
      const baseTable = BASE_CATEGORY_TABLES[key]
      
      for (const retailer of Object.values(RETAILERS)) {
        const table = retailer.tableSuffix ? `${baseTable}${retailer.tableSuffix}` : baseTable
        
        try {
          const { data, error } = await supabase.from(table).select("*")
          
          if (error) {
            if (!/does not exist/i.test(error.message)) {
              console.error(`Supabase error on ${table}:`, error.message)
            }
            continue
          }
          
          const normalized = (data || []).map((row: any) => normalizeRow(key, row, retailer))
          results.push(...normalized)
        } catch (error) {
          console.error(`Error fetching from ${table}:`, error)
          continue
        }
      }
    }

    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
      }
    })
  } catch (e: any) {
    console.error("API /components failed:", e?.message || e)
    return NextResponse.json(
      { error: "Failed to load components", details: e?.message },
      { status: 500 }
    )
  }
}
