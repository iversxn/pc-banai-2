import { notFound } from "next/navigation"
import CategoryBrowserClient from "@/components/CategoryBrowserClient"
import { getComponents } from "@/lib/getComponents"

export const revalidate = 1800

const validCategories = ["cpu", "motherboard", "ram", "gpu", "storage", "psu", "case", "cooling"]

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params // ← required in Next.js 15

  if (!validCategories.includes(category)) notFound()

  const initialItems = await getComponents(category)

  return <CategoryBrowserClient initialItems={initialItems} category={category} />
}
