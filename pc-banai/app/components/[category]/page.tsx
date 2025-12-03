import { notFound } from "next/navigation";
import CategoryBrowserClient from "@/components/CategoryBrowserClient";
import { getComponents } from "@/lib/getComponents";

export const revalidate = 1800;

const valid = ["cpu","motherboard","ram","gpu","storage","psu","case","cooling"];

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = params.category;

  if (!valid.includes(category)) notFound();

  const initialItems = await getComponents(category);

  return <CategoryBrowserClient initialItems={initialItems} category={category} />;
}
