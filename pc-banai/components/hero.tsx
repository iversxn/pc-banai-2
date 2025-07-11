"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Monitor, Cpu, HardDrive, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-6xl">PC Banai</h1>
              <p className="text-xl text-blue-600 font-medium">স্বপ্ন হবে বাস্তব</p>
              <p className="text-lg text-gray-600 max-w-lg">
                Build your dream PC with real-time price comparison from 25+ Bangladeshi retailers. Get compatibility
                checking and community support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  document.getElementById("build-configurator")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Start Building
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById("price-comparison")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Compare Prices
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">25+</div>
                <div className="text-sm text-gray-600">Retailers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Components</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Monitor className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold mb-2">Build Configurator</h3>
                  <p className="text-sm text-gray-600">Interactive PC builder</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm mt-8">
                <CardContent className="p-6 text-center">
                  <Cpu className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold mb-2">Compatibility Check</h3>
                  <p className="text-sm text-gray-600">Automated validation</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <HardDrive className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold mb-2">Price Comparison</h3>
                  <p className="text-sm text-gray-600">Best local deals</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm mt-8">
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                  <h3 className="font-semibold mb-2">Community Hub</h3>
                  <p className="text-sm text-gray-600">Share & get help</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
