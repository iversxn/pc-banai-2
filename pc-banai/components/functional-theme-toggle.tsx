"use client"

import { Button } from "@/components/ui/button"
import { useFunctionalTheme } from "@/hooks/use-functional-theme"
import { Sun, Moon, Monitor, Loader2 } from "lucide-react"

export function FunctionalThemeToggle() {
  const { theme, resolvedTheme, isChanging, cycleTheme } = useFunctionalTheme()

  const getIcon = () => {
    if (isChanging) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }

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

  const getLabel = () => {
    if (theme === "system") {
      return `System (${resolvedTheme})`
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      className="flex items-center gap-2 bg-transparent"
      disabled={isChanging}
    >
      {getIcon()}
      <span className="capitalize">{getLabel()}</span>
    </Button>
  )
}
