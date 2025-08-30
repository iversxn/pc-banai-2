// app/components/[category]/page.tsx
import CategoryBrowserClient from "@/components/CategoryBrowserClient"
import supabase from "@/utils/supabaseClient"
import { notFound } from "next/navigation"

export const revalidate = 1800 // 30 minutes

// Map friendly slugs to your DB tables.
// Adjust table names if your tables are named slightly differently.
const TABLE_MAP: Record<string, string | string[]> = {
  cpu: "processors",
  motherboard: "motherboards",
  ram: "rams",
  gpu: "graphics_cards",
  storage: ["ssd_drives", "hdds"], // SSD + HDD merged
  psu: "power_supplies",
  case: "casings",
  cooling: ["cpu_coolers", "casing_coolers"],
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const slug = params.category
  if (!Object.keys(TABLE_MAP).includes(slug)) return notFound()

  const tables = TABLE_MAP[slug]
  let rows: any[] = []

  try {
    if (Array.isArray(tables)) {
      // fetch from several tables and merge
      const promises = tables.map((t) =>
        supabase.from(t).select("*").maybeSingle ? supabase.from(t).select("*") : supabase.from(t).select("*")
      )
      const results = await Promise.all(promises)
      rows = results.flatMap((r: any) => (r?.data ? r.data : []))
    } else {
      const { data, error } = await supabase.from(tables).select("*")
      if (error) {
        console.error("Supabase error:", error)
        rows = []
      } else {
        rows = data || []
      }
    }
  } catch (err) {
    console.error("Fetch error:", err)
    rows = []
  }

  // normalize minimal fields so client component works
  const normalized = rows.map((r: any) => ({
    id: r.id ?? r.product_url ?? r.product_name,
    product_name: r.product_name ?? r.name ?? "Unknown",
    brand: r.brand ?? "N/A",
    socket: r.socket ?? null,
    specs: r.short_specs ?? r.specifications ?? "",
    image: r.image_url ?? (r.images && r.images[0]) ?? null,
    // The scrapers put a single price in price_bdt; we'll present it as a single entry
    prices:
      r.prices ??
      [
        {
          retailer: "startech",
          price: Number(String(r.price_bdt || "0").replace(/[^0-9]/g, "")) || 0,
          inStock:
            (Number(String(r.price_bdt || "0").replace(/[^0-9]/g, "")) || 0) > 0 ||
            (r.availability && String(r.availability).toLowerCase().includes("in stock")),
          productUrl: r.product_url ?? null,
        },
      ],
    category: slug,
    socket_raw: r.socket ?? null,
  }))

  // Server component: render client component, passing serialized data
  return <CategoryBrowserClient initialItems={normalized} category={slug} />
}
