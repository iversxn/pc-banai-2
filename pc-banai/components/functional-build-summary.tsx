import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { BuildState } from "@/types"
import { Zap, DollarSign, Package, Cpu } from "lucide-react"

interface FunctionalBuildSummaryProps {
  buildState: BuildState
  totalPrice: number
  totalWattage: number
  componentCount: number
}

export function FunctionalBuildSummary({
  buildState,
  totalPrice,
  totalWattage,
  componentCount,
}: FunctionalBuildSummaryProps) {
  const maxComponents = 8
  const completionPercentage = (componentCount / maxComponents) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Build Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Build Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Build Progress</span>
            <span>
              {componentCount}/{maxComponents} components
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">৳{totalPrice.toLocaleString()}</div>
            <div className="text-sm text-green-800 dark:text-green-200">Total Price</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <Zap className="h-5 w-5 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{totalWattage}W</div>
            <div className="text-sm text-orange-800 dark:text-orange-200">Power Draw</div>
          </div>
        </div>

        {/* Component List */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Selected Components
          </h4>

          {componentCount === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No components selected</p>
              <p className="text-sm bengali-text">কোন কম্পোনেন্ট নির্বাচিত নেই</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(buildState.components).map(([category, component]) => {
                if (Array.isArray(component)) {
                  return component.map((comp, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex justify-between items-center p-2 bg-muted/50 rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{comp.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {category} #{index + 1}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ৳{Math.min(...comp.prices.map((p) => p.price)).toLocaleString()}
                      </Badge>
                    </div>
                  ))
                } else if (component) {
                  return (
                    <div key={category} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{component.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{category}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ৳{Math.min(...component.prices.map((p) => p.price)).toLocaleString()}
                      </Badge>
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>

        {/* Build Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span>Build Status:</span>
            <Badge variant={buildState.compatibility.isCompatible ? "default" : "destructive"}>
              {buildState.compatibility.isCompatible ? "Compatible" : "Has Issues"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
