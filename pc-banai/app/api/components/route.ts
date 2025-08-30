import { NextResponse } from "next/server"
import supabase from "@/utils/supabaseClient"

// ISR for API (Next.js app router)
export const revalidate = 1800 // 30 minutes

// Map app categories -> table names in your Supabase.
// Adjust any table names if different in your project.
const CATEGORY_TABLES: Record<string, string> = {
  cpu: "processors",
  motherboard: "motherboards",
  ram: "rams",
  gpu: "graphics_cards",
  storage_ssd: "ssd_drives",      // if your table is "ssd", set here
  storage_hdd: "hdds",            // if "hard_disk_drive", set here
  psu: "power_supplies",
  case: "casings",
  cooling_cpu: "cpu_coolers",
  cooling_case: "casing_coolers",
}

// Normalize a row from any category table into the Component shape.
function normalizeRow(categoryKey: string, row: any) {
  const priceNumber = Number(String(row.price_bdt || "0").replace(/[^0-9]/g, "")) || 0
  const inStockFlag =
    priceNumber > 0 ||
    (row.availability && String(row.availability).toLowerCase().includes("in stock"))

  // Put single retailer (StarTech) as baseline.
  // If you later add more retailers to your DB, extend this array accordingly.
  const prices = [
    {
      retailerId: "startech",
      retailerName: "StarTech",
      price: priceNumber,
      currency: "BDT",
      inStock: inStockFlag,
      productUrl: row.product_url || null,
      lastUpdated: new Date().toISOString(),
      shippingCost: 0,
      warranty: null,
      rating: null,
      trend: "stable",
    },
  ]

  // Map categoryKey to app category values your UI uses
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
    id: `${categoryKey}-${row.id || row.product_url || row.product_name}`,
    name: row.product_name || "Unknown",
    nameBengali: row.product_name || "অজানা",
    brand: row.brand || "N/A",
    category: categoryMap[categoryKey],
    specifications: { summary: row.short_specs || "" },
    compatibility: {},

    // Pricing from this and (later) other retailers
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
    const categoryParam = searchParams.get("category") // e.g. "cpu" or "motherboard"

    // Build query list based on param
    const categoryKeys = categoryParam
      ? Object.keys(CATEGORY_TABLES).filter((k) => {
          const mapped = {
            cpu: ["cpu"],
            motherboard: ["motherboard"],
            ram: ["ram"],
            gpu: ["gpu"],
            storage: ["storage_ssd", "storage_hdd"],
            psu: ["psu"],
            case: ["case"],
            cooling: ["cooling_cpu", "cooling_case"],
          } as Record<string, string[]>

          return mapped[categoryParam]?.includes(k)
        })
      : Object.keys(CATEGORY_TABLES)

    const results: any[] = []

    // Fetch all tables and normalize
    for (const key of categoryKeys) {
      const table = CATEGORY_TABLES[key]
      const { data, error } = await supabase.from(table).select("*")
      if (error) {
        console.error(`Supabase error on ${table}:`, error.message)
        continue
      }
      const normalized = (data || []).map((row) => normalizeRow(key, row))
      results.push(...normalized)
    }

    // If user asked "storage", merge SSD + HDD in one response category
    // Already done by mapping category->"storage" above.

    // Return unified list
    return NextResponse.json(results, { status: 200 })
  } catch (e: any) {
    console.error("API /components failed:", e?.message || e)
    return NextResponse.json({ error: "Failed to load components" }, { status: 500 })
  }
}
