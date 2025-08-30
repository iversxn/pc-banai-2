"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  showInStockOnly: boolean
  setShowInStockOnly: (v: boolean) => void
  stockSort: "none" | "in-first" | "out-first"
  setStockSort: (v: "none" | "in-first" | "out-first") => void
}

export default function AdvancedFilters({
  showInStockOnly,
  setShowInStockOnly,
  stockSort,
  setStockSort,
}: Props) {
  return (
    <div className="flex items-center gap-6 py-2">
      <div className="flex items-center gap-2">
        <Switch id="instock" checked={showInStockOnly} onCheckedChange={setShowInStockOnly} />
        <Label htmlFor="instock">Only show In-Stock</Label>
      </div>

      <div className="flex items-center gap-2">
        <Label>Sort by availability</Label>
        <Select value={stockSort} onValueChange={(v) => setStockSort(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="in-first">In-Stock first</SelectItem>
            <SelectItem value="out-first">Out-of-Stock first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
