// app/components/[category]/page.tsx

import { notFound } from "next/navigation"
import { FunctionalComponentSelector } from "@/components/functional-component-selector"

// ✅ Map slug → database category
const categoryMap: Record<string, string> = {
  cpu: "processor",
  gpu: "gpu",
  ram: "ram",
  motherboard: "motherboard",
  psu: "psu",
  case: "case",
  storage: "storage",
  cooling: "cooling",
}

export const revalidate = 1800 // ISR: re-generate every 30 mins

async function getComponents(category: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/components?category=${category}`,
    { next: { revalidate: 1800 } }
  )

  if (!res.ok) return null
  return res.json()
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = categoryMap[params.category]

  if (!category) return notFound()

  const components = await getComponents(category)
  if (!components) return notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 capitalize">{params.category}</h1>
      <FunctionalComponentSelector
        category={params.category as keyof typeof categoryMap}
        components={components}
        selectedComponents={[]}
        onSelect={() => {}}
        onRemove={() => {}}
      />
    </div>
  )
}
