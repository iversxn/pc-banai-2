"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFunctionalBuildConfigurator } from "@/hooks/use-functional-build-configurator"
import { FunctionalComponentSelector } from "./functional-component-selector"
import { FunctionalCompatibilityChecker } from "./functional-compatibility-checker"
import { FunctionalBuildSummary } from "./functional-build-summary"
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Zap,
  Box,
  Fan,
  CircuitBoardIcon as Motherboard,
  Loader2,
} from "lucide-react"

const categoryIcons = {
  cpu: Cpu,
  motherboard: Motherboard,
  ram: MemoryStick,
  gpu: Monitor,
  storage: HardDrive,
  psu: Zap,
  case: Box,
  cooling: Fan,
}

const categoryNames = {
  cpu: { en: "Processor", bn: "প্রসেসর" },
  motherboard: { en: "Motherboard", bn: "মাদারবোর্ড" },
  ram: { en: "Memory", bn: "র্যাম" },
  gpu: { en: "Graphics Card", bn: "গ্রাফিক্স কার্ড" },
  storage: { en: "Storage", bn: "স্টোরেজ" },
  psu: { en: "Power Supply", bn: "পাওয়ার সাপ্লাই" },
  case: { en: "Case", bn: "কেস" },
  cooling: { en: "Cooling", bn: "কুলিং" },
}

export function FunctionalBuildConfigurator() {
  const {
    buildState,
    selectedComponents,
    totalPrice,
    totalWattage,
    compatibility,
    isCalculating,
    buildHistory,
    selectComponent,
    removeComponent,
    clearBuild,
    saveBuild,
    getCompatibleComponents,
  } = useFunctionalBuildConfigurator()

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof categoryNames>("cpu")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  // REAL BUILD SAVING - ACTUALLY SAVES AND SHOWS FEEDBACK
  const handleSaveBuild = async () => {
    setIsSaving(true)
    try {
      const shareUrl = saveBuild()
      setSaveMessage(`Build saved! URL copied to clipboard: ${shareUrl.slice(0, 50)}...`)
      setTimeout(() => setSaveMessage(""), 5000)
    } catch (error) {
      setSaveMessage("Failed to save build. Please try again.")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // REAL BUILD CLEARING - ACTUALLY CLEARS WITH CONFIRMATION
  const handleClearBuild = () => {
    if (Object.keys(selectedComponents).length > 0) {
      if (confirm("Are you sure you want to clear this build? This action cannot be undone.")) {
        clearBuild()
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">PC Build Configurator</h1>
        <p className="text-lg text-muted-foreground">পিসি বিল্ড কনফিগারেটর</p>
        {isCalculating && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculating compatibility and prices...
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Component Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Components</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on components to add them to your build. Compatible components are highlighted.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as keyof typeof categoryNames)}
              >
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
                  {Object.entries(categoryNames).map(([key, names]) => {
                    const Icon = categoryIcons[key as keyof typeof categoryIcons]
                    const hasComponent = selectedComponents[key as keyof typeof selectedComponents]
                    const componentCount = Array.isArray(hasComponent) ? hasComponent.length : hasComponent ? 1 : 0

                    return (
                      <TabsTrigger key={key} value={key} className="flex flex-col gap-1 p-2 relative">
                        <Icon className={`h-4 w-4 ${componentCount > 0 ? "text-green-600" : ""}`} />
                        <span className="text-xs hidden lg:block">{names.en}</span>
                        {componentCount > 0 && (
                          <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                            {componentCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {Object.keys(categoryNames).map((category) => (
                  <TabsContent key={category} value={category}>
                    <FunctionalComponentSelector
                      category={category as keyof typeof categoryNames}
                      components={getCompatibleComponents(category as keyof typeof selectedComponents)}
                      selectedComponents={selectedComponents[category as keyof typeof selectedComponents]}
                      onSelect={selectComponent}
                      onRemove={removeComponent}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Build Summary & Compatibility */}
        <div className="space-y-6">
          <FunctionalBuildSummary
            buildState={buildState}
            totalPrice={totalPrice}
            totalWattage={totalWattage}
            componentCount={Object.keys(selectedComponents).length}
          />

          <FunctionalCompatibilityChecker compatibility={compatibility} />

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveBuild}
              className="w-full"
              disabled={isSaving || Object.keys(selectedComponents).length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Build...
                </>
              ) : (
                "Save & Share Build"
              )}
            </Button>

            <Button
              onClick={handleClearBuild}
              variant="outline"
              className="w-full bg-transparent"
              disabled={Object.keys(selectedComponents).length === 0}
            >
              Clear Build
            </Button>

            {saveMessage && <div className="text-xs text-center p-2 bg-muted rounded">{saveMessage}</div>}
          </div>

          {/* Build History */}
          {buildHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Builds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {buildHistory.slice(0, 3).map((build, index) => (
                    <div key={index} className="text-xs p-2 bg-muted rounded">
                      <div className="font-medium">Build #{index + 1}</div>
                      <div className="text-muted-foreground">
                        ৳{build.totalPrice.toLocaleString()} • {build.wattage}W
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
