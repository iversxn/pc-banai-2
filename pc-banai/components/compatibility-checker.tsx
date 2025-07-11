import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CompatibilityCheck } from "@/types"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface CompatibilityCheckerProps {
  compatibility: CompatibilityCheck
}

export function CompatibilityChecker({ compatibility }: CompatibilityCheckerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {compatibility.isCompatible ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          Compatibility Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {compatibility.isCompatible && compatibility.warnings.length === 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">All components are compatible</span>
          </div>
        )}

        {compatibility.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Compatibility Issues
            </h4>
            {compatibility.errors.map((error, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error.message}</p>
                <p className="text-xs text-red-600 mt-1">{error.messageBengali}</p>
                <div className="flex gap-1 mt-2">
                  {error.components.map((comp) => (
                    <Badge key={comp} variant="destructive" className="text-xs">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {compatibility.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </h4>
            {compatibility.warnings.map((warning, index) => (
              <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{warning.message}</p>
                <p className="text-xs text-yellow-600 mt-1">{warning.messageBengali}</p>
                <div className="flex gap-1 mt-2">
                  {warning.components.map((comp) => (
                    <Badge key={comp} variant="outline" className="text-xs border-yellow-300">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
