"use client"

import { useState, useCallback } from "react"
import type { BuildState, ComponentSelection } from "@/types"

export function useBuildSharing() {
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  const generateBuildURL = useCallback((build: BuildState): string => {
    const params = new URLSearchParams()

    // Encode build components into URL parameters
    Object.entries(build.components).forEach(([category, component]) => {
      if (Array.isArray(component)) {
        params.set(category, component.map((c) => c.id).join(","))
      } else if (component) {
        params.set(category, component.id)
      }
    })

    // Add build metadata
    params.set("total", build.totalPrice.toString())
    params.set("wattage", build.wattage.toString())
    params.set("timestamp", Date.now().toString())

    const baseUrl = window.location.origin
    return `${baseUrl}/build?${params.toString()}`
  }, [])

  const parseBuildURL = useCallback((url: string): Partial<ComponentSelection> => {
    try {
      const urlObj = new URL(url)
      const params = urlObj.searchParams
      const components: Partial<ComponentSelection> = {}

      // Parse component IDs from URL parameters
      const categories = ["cpu", "motherboard", "ram", "gpu", "storage", "psu", "case", "cooling"]

      categories.forEach((category) => {
        const value = params.get(category)
        if (value) {
          if (category === "ram" || category === "storage") {
            // Handle arrays
            components[category as keyof ComponentSelection] = value.split(",") as any
          } else {
            components[category as keyof ComponentSelection] = value as any
          }
        }
      })

      return components
    } catch (error) {
      console.error("Failed to parse build URL:", error)
      return {}
    }
  }, [])

  const shareBuild = useCallback(
    async (build: BuildState, title?: string) => {
      setIsSharing(true)

      try {
        const buildUrl = generateBuildURL(build)
        setShareUrl(buildUrl)

        // Generate short URL using a free service (simulate)
        const shortUrl = await generateShortUrl(buildUrl)

        // Share via Web Share API if available
        if (navigator.share) {
          await navigator.share({
            title: title || "My PC Build - PC Banai",
            text: `Check out my PC build worth ৳${build.totalPrice.toLocaleString()}`,
            url: shortUrl,
          })
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shortUrl)
          // Show notification
        }

        return shortUrl
      } catch (error) {
        console.error("Failed to share build:", error)
        throw error
      } finally {
        setIsSharing(false)
      }
    },
    [generateBuildURL],
  )

  const exportBuildAsPDF = useCallback((build: BuildState) => {
    // Generate PDF content
    const content = generateBuildReport(build)

    // Create and download PDF (simplified implementation)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pc-build-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const generateQRCode = useCallback((buildUrl: string): string => {
    // Generate QR code data URL (simplified)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildUrl)}`
  }, [])

  return {
    isSharing,
    shareUrl,
    generateBuildURL,
    parseBuildURL,
    shareBuild,
    exportBuildAsPDF,
    generateQRCode,
  }
}

// Helper functions
async function generateShortUrl(longUrl: string): Promise<string> {
  // Simulate short URL generation (in production, use a service like bit.ly)
  const hash = btoa(longUrl).slice(0, 8)
  return `https://pcbanai.com/s/${hash}`
}

function generateBuildReport(build: BuildState): string {
  let report = "PC Banai Build Report\n"
  report += "=====================\n\n"
  report += `Total Price: ৳${build.totalPrice.toLocaleString()}\n`
  report += `Power Consumption: ${build.wattage}W\n`
  report += `Generated: ${new Date().toLocaleDateString()}\n\n`

  report += "Components:\n"
  report += "-----------\n"

  Object.entries(build.components).forEach(([category, component]) => {
    if (Array.isArray(component)) {
      component.forEach((comp, index) => {
        report += `${category.toUpperCase()} ${index + 1}: ${comp.name}\n`
        report += `  Price: ৳${Math.min(...comp.prices.map((p) => p.price)).toLocaleString()}\n`
      })
    } else if (component) {
      report += `${category.toUpperCase()}: ${component.name}\n`
      report += `  Price: ৳${Math.min(...component.prices.map((p) => p.price)).toLocaleString()}\n`
    }
  })

  return report
}
