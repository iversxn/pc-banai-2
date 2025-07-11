"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const themes = ["light", "dark", "system"] as const
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      case "system":
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={cycleTheme} className="flex items-center gap-2 bg-transparent">
      {getIcon()}
      <span className="capitalize">{theme}</span>
    </Button>
  )
}
