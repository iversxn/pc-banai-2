import { supabaseServer } from "@/utils/supabaseServer";

const RETAILERS = {
  startech: { id: "startech", name: "StarTech", tableSuffix: null },
  techland: { id: "techland", name: "Techland BD", tableSuffix: "_techland" },
  ultratech: { id: "ultratech", name: "Ultratech BD", tableSuffix: "_ultratech" },
  skyland: { id: "skyland", name: "Skyland BD", tableSuffix: "_skyland" },
} as const;

const BASE_TABLES: Record<string, string> = {
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
};

const PARAM_MAP: Record<string, string[]> = {
  cpu: ["cpu"],
  motherboard: ["motherboard"],
  ram: ["ram"],
  gpu: ["gpu"],
  storage: ["storage_ssd", "storage_hdd"],
  psu: ["psu"],
  case: ["case"],
  cooling: ["cooling_cpu", "cooling_case"],
};

function normalizeRow(key: string, row: any, retailer: typeof RETAILERS[keyof typeof RETAILERS]) {
  const price = Number(String(row.price_bdt || 0).replace(/[^0-9]/g, "")) || 0;
  const inStock = price > 0 || String(row.availability || "").toLowerCase().includes("in stock");

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
  };

  return {
    id: `${retailer.id}-${row.id || row.product_url?.split("/").pop() || Date.now()}`,
    name: row.product_name || "Unknown",
    nameBengali: row.product_name || "অজানা",
    brand: row.brand || "N/A",
    category: categoryMap[key],
    specifications: { summary: row.short_specs || "" },
    prices: [
      {
        retailerId: retailer.id,
        retailerName: retailer.name,
        price,
        currency: "BDT",
        inStock,
        productUrl: row.product_url || null,
        lastUpdated: new Date().toISOString(),
        shippingCost: 0,
        warranty: "",
        rating: 0,
        trend: "stable" as const,
      },
    ],
    images: row.image_url ? [row.image_url] : [],
    powerConsumption: Number(row.power_consumption || 0),
    socket: row.socket || null,
    memoryType: row.memory_type || null,
    formFactor: row.form_factor || null,
    reviews: [],
  };
}

export async function getComponents(categoryParam?: string) {
  const keys = categoryParam ? PARAM_MAP[categoryParam] || [] : Object.keys(BASE_TABLES);
  const results: any[] = [];

  for (const key of keys) {
    const baseTable = BASE_TABLES[key];
    if (!baseTable) continue;

    for (const retailer of Object.values(RETAILERS)) {
      const tableName = retailer.tableSuffix ? `${baseTable}${retailer.tableSuffix}` : baseTable;
      const { data, error } = await supabaseServer.from(tableName).select("*");

      if (error) {
        console.error(`Supabase error [${tableName}]:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        results.push(...data.map((row) => normalizeRow(key, row, retailer)));
      }
    }
  }

  return results;
}
