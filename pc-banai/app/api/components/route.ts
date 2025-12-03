import { NextResponse } from "next/server";
import { getComponents } from "@/lib/getComponents";

export const revalidate = 1800; // 30 min cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const data = await getComponents(category);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 });
  }
}
