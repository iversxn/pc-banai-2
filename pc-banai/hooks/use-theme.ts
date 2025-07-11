"use client"

import { useState, useEffect } from "react"

type Theme = "light" | "dark" | "system"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load theme from localStorage or URL params
    const savedTheme = localStorage.getItem("pc-banai-theme") as Theme
    const urlParams = new URLSearchParams(window.location.search)
    const urlTheme = urlParams.get("theme") as Theme

    const initialTheme = urlTheme || savedTheme || "system"
    setTheme(initialTheme)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (newTheme: "light" | "dark") => {
      root.classList.remove("light", "dark")
      root.classList.add(newTheme)
      setResolvedTheme(newTheme)
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      applyTheme(systemTheme)

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light")
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      applyTheme(theme)
    }
  }, [theme])

  const setThemeWithPersistence = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("pc-banai-theme", newTheme)

    // Update URL params
    const url = new URL(window.location.href)
    if (newTheme === "system") {
      url.searchParams.delete("theme")
    } else {
      url.searchParams.set("theme", newTheme)
    }
    window.history.replaceState({}, "", url.toString())
  }

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeWithPersistence,
  }
}
