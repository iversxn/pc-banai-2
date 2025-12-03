"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Item = {
  id: string;
  name: string;
  brand: string;
  images: string[];
  specifications: { summary: string };
  prices: Array<{
    price: number;
    retailerName: string;
    productUrl?: string | null;
    inStock: boolean;
  }>;
};

export default function CategoryBrowserClient({
  initialItems = [],
  category,
}: {
  initialItems: Item[];
  category: string;
}) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const brands = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach((i) => i.brand && i.brand !== "N/A" && set.add(i.brand));
    return Array.from(set).sort();
  }, [initialItems]);

  const filtered = useMemo(() => {
    if (!selectedBrand) return initialItems;
    return initialItems.filter((i) => i.brand === selectedBrand);
  }, [initialItems, selectedBrand]);

  const bestPrice = (prices: Item["prices"]) => {
    if (!prices.length) return null;
    return prices.reduce((best, p) => (p.price < best.price ? p : best));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 capitalize">{category}</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Filter Sidebar */}
        <aside className="lg:w-64">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold mb-4">Brand Filter</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedBrand(null)}
                className={`w-full text-left px-4 py-2 rounded-md border ${!selectedBrand ? "bg-primary text-primary-foreground" : ""}`}
              >
                All Brands ({initialItems.length})
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`w-full text-left px-4 py-2 rounded-md border ${selectedBrand === b ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {b} ({initialItems.filter((i) => i.brand === b).length})
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-xl py-20">No components found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const bp = bestPrice(item.prices);
                return (
                  <div key={item.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-card">
                    {item.images[0] ? (
                      <div className="h-64 bg-muted relative">
                        <Image src={item.images[0]} alt={item.name} fill className="object-contain p-4" />
                      </div>
                    ) : (
                      <div className="h-64 bg-muted flex items-center justify-center text-muted-foreground">No image</div>
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-lg line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.brand}</p>
                      {item.specifications.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{item.specifications.summary}</p>
                      )}
                      {bp && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-2xl font-bold">৳{bp.price.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{bp.retailerName}</p>
                          {!bp.inStock && <p className="text-red-600 text-xs">Out of stock</p>}
                          {bp.productUrl && (
                            <a
                              href={bp.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                            >
                              View Deal →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
