import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { BuildState } from "@/types"

interface BuildSummaryProps {
  buildState: BuildState
}

export function BuildSummary({ buildState }: BuildSummaryProps) {
  const componentCount = Object.keys(buildState.components).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">৳{buildState.totalPrice.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total Price</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{buildState.wattage}W</div>
            <div className="text-sm text-orange-800">Power Draw</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Selected Components ({componentCount}/8)</h4>
          {Object.entries(buildState.components).map(([category, component]) => {
            if (Array.isArray(component)) {
              return component.map((comp, index) => (
                <div key={`${category}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{comp.name}</div>
                    <div className="text-xs text-gray-600">{category}</div>
                  </div>
                  <Badge variant="outline">৳{Math.min(...comp.prices.map((p) => p.price)).toLocaleString()}</Badge>
                </div>
              ))
            } else if (component) {
              return (
                <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{component.name}</div>
                    <div className="text-xs text-gray-600">{category}</div>
                  </div>
                  <Badge variant="outline">৳{Math.min(...component.prices.map((p) => p.price)).toLocaleString()}</Badge>
                </div>
              )
            }
            return null
          })}
        </div>

        {componentCount === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>No components selected</p>
            <p className="text-sm">কোন কম্পোনেন্ট নির্বাচিত নেই</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
