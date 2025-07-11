"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBuildConfigurator } from "@/hooks/use-build-configurator"
import { ComponentSelector } from "./component-selector"
import { CompatibilityChecker } from "./compatibility-checker"
import { BuildSummary } from "./build-summary"
import { Cpu, HardDrive, MemoryStick, Monitor, Zap, Box, Fan, CircuitBoardIcon as Motherboard } from "lucide-react"

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

export function BuildConfigurator() {
  const { buildState, updateComponent, clearBuild, getCompatibleComponents } = useBuildConfigurator()
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof categoryNames>("cpu")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PC Build Configurator</h1>
        <p className="text-lg text-gray-600">পিসি বিল্ড কনফিগারেটর</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Component Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Components</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as keyof typeof categoryNames)}
              >
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
                  {Object.entries(categoryNames).map(([key, names]) => {
                    const Icon = categoryIcons[key as keyof typeof categoryIcons]
                    const hasComponent = buildState.components[key as keyof typeof buildState.components]

                    return (
                      <TabsTrigger key={key} value={key} className="flex flex-col gap-1 p-2">
                        <Icon className={`h-4 w-4 ${hasComponent ? "text-green-600" : ""}`} />
                        <span className="text-xs hidden lg:block">{names.en}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {Object.keys(categoryNames).map((category) => (
                  <TabsContent key={category} value={category}>
                    <ComponentSelector
                      category={category as keyof typeof categoryNames}
                      components={getCompatibleComponents(category as keyof typeof buildState.components)}
                      selectedComponent={buildState.components[category as keyof typeof buildState.components] as any}
                      onSelect={(component) =>
                        updateComponent(category as keyof typeof buildState.components, component)
                      }
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Build Summary & Compatibility */}
        <div className="space-y-6">
          <BuildSummary buildState={buildState} />
          <CompatibilityChecker compatibility={buildState.compatibility} />

          <div className="flex flex-col gap-2">
            <Button onClick={clearBuild} variant="outline" className="w-full bg-transparent">
              Clear Build
            </Button>
            <Button className="w-full">Save Build</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
