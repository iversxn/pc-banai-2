// app/components/[category]/page.tsx
import { FunctionalComponentSelector } from "@/components/functional-component-selector"
import supabase from "@/utils/supabaseClient"

interface PageProps {
  params: {
    category: string
  }
}

export const revalidate = 1800 // ISR: 30 minutes

export default async function CategoryPage({ params }: PageProps) {
  const { category } = params

  // Fetch from API (or directly from supabase)
  const { data, error } = await supabase
    .from("components")
    .select("*")
    .eq("category", category)

  if (error) {
    console.error(error)
    return <div>Failed to load {category}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{category.toUpperCase()}</h1>
      <FunctionalComponentSelector
        category={category}
        components={data || []}
        selectedComponents={[]}
        onSelect={() => {}}
        onRemove={() => {}}
      />
    </div>
  )
}
