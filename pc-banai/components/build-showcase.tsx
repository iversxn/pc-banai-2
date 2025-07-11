"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gamepad2, Briefcase, Palette } from "lucide-react"

export function BuildShowcase() {
  const builds = {
    gaming: [
      {
        name: "Budget Gaming Beast",
        nameBn: "বাজেট গেমিং বিস্ট",
        price: "৳85,000",
        specs: ["Ryzen 5 5600", "RTX 3060", "16GB DDR4", "500GB NVMe"],
        performance: "High 1080p Gaming",
      },
      {
        name: "Ultimate Gaming Rig",
        nameBn: "আল্টিমেট গেমিং রিগ",
        price: "৳2,50,000",
        specs: ["Ryzen 7 7800X3D", "RTX 4080", "32GB DDR5", "2TB NVMe"],
        performance: "4K Ultra Gaming",
      },
    ],
    office: [
      {
        name: "Office Productivity",
        nameBn: "অফিস প্রোডাক্টিভিটি",
        price: "৳45,000",
        specs: ["Ryzen 5 5600G", "Integrated Graphics", "16GB DDR4", "256GB SSD"],
        performance: "Office & Web Browsing",
      },
      {
        name: "Business Workstation",
        nameBn: "বিজনেস ওয়ার্কস্টেশন",
        price: "৳1,20,000",
        specs: ["Intel i7-13700", "RTX 3060", "32GB DDR4", "1TB NVMe"],
        performance: "Professional Work",
      },
    ],
    creative: [
      {
        name: "Content Creator Setup",
        nameBn: "কন্টেন্ট ক্রিয়েটর সেটআপ",
        price: "৳1,80,000",
        specs: ["Ryzen 9 7900X", "RTX 4070", "64GB DDR5", "2TB NVMe"],
        performance: "Video Editing & Streaming",
      },
    ],
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular PC Builds</h2>
          <p className="text-lg text-gray-600">Curated builds for every budget and use case</p>
        </div>

        <Tabs defaultValue="gaming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="gaming" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Gaming
            </TabsTrigger>
            <TabsTrigger value="office" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Office
            </TabsTrigger>
            <TabsTrigger value="creative" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Creative
            </TabsTrigger>
          </TabsList>

          {Object.entries(builds).map(([category, categoryBuilds]) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categoryBuilds.map((build, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div>
                          <div className="text-lg">{build.name}</div>
                          <div className="text-sm text-blue-600 font-normal">{build.nameBn}</div>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold text-green-600">
                          {build.price}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Components:</h4>
                          <div className="space-y-1">
                            {build.specs.map((spec, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs mr-1 mb-1">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2">
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{build.performance}</Badge>
                        </div>
                        <Button className="w-full mt-4 bg-transparent" variant="outline">
                          View Full Build
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
