import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CompatibilityCheck } from "@/types"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

interface FunctionalCompatibilityCheckerProps {
  compatibility: CompatibilityCheck
}

export function FunctionalCompatibilityChecker({ compatibility }: FunctionalCompatibilityCheckerProps) {
  const hasIssues = compatibility.errors.length > 0 || compatibility.warnings.length > 0

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
          <Badge variant={compatibility.isCompatible ? "default" : "destructive"} className="ml-auto">
            {compatibility.isCompatible ? "Compatible" : "Issues Found"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasIssues && (
          <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">All components are compatible</p>
              <p className="text-xs text-green-600/80">সব কম্পোনেন্ট সামঞ্জস্যপূর্ণ</p>
            </div>
          </div>
        )}

        {compatibility.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Critical Issues ({compatibility.errors.length})
            </h4>
            {compatibility.errors.map((error, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md"
              >
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error.message}</p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1 bengali-text">{error.messageBengali}</p>
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
              Warnings ({compatibility.warnings.length})
            </h4>
            {compatibility.warnings.map((warning, index) => (
              <div
                key={index}
                className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
              >
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">{warning.message}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1 bengali-text">
                  {warning.messageBengali}
                </p>
                <div className="flex gap-1 mt-2">
                  {warning.components.map((comp) => (
                    <Badge key={comp} variant="outline" className="text-xs border-yellow-300 dark:border-yellow-700">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasIssues && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Need help resolving these issues?</p>
              <p className="text-xs mt-1">Visit our community forum or contact support for assistance.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
