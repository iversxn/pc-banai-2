"use client"

import { useState, useEffect, useCallback } from "react"

type Theme = "light" | "dark" | "system"

export function useFunctionalTheme() {
  const [theme, setTheme] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [isChanging, setIsChanging] = useState(false)

  // REAL THEME APPLICATION - ACTUALLY CHANGES CSS
  const applyTheme = useCallback((newTheme: "light" | "dark") => {
    const root = document.documentElement

    // Actually remove old classes
    root.classList.remove("light", "dark")

    // Actually add new class
    root.classList.add(newTheme)

    // Update resolved theme state
    setResolvedTheme(newTheme)

    // Actually save to localStorage
    localStorage.setItem("pc-banai-resolved-theme", newTheme)
  }, [])

  // REAL SYSTEM THEME DETECTION - ACTUALLY LISTENS TO SYSTEM
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const systemTheme = e.matches ? "dark" : "light"
        applyTheme(systemTheme)
      }
    }

    // Actually listen to system changes
    mediaQuery.addEventListener("change", handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
  }, [theme, applyTheme])

  // REAL THEME INITIALIZATION - ACTUALLY LOADS FROM STORAGE
  useEffect(() => {
    // Actually load from localStorage
    const savedTheme = localStorage.getItem("pc-banai-theme") as Theme
    const urlParams = new URLSearchParams(window.location.search)
    const urlTheme = urlParams.get("theme") as Theme

    const initialTheme = urlTheme || savedTheme || "system"
    setTheme(initialTheme)

    // Apply initial theme
    if (initialTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      applyTheme(systemTheme)
    } else {
      applyTheme(initialTheme)
    }
  }, [applyTheme])

  // REAL THEME SWITCHING - ACTUALLY CHANGES THEME
  const changeTheme = useCallback(
    (newTheme: Theme) => {
      setIsChanging(true)

      // Actually update state
      setTheme(newTheme)

      // Actually save to localStorage
      localStorage.setItem("pc-banai-theme", newTheme)

      // Actually update URL
      const url = new URL(window.location.href)
      if (newTheme === "system") {
        url.searchParams.delete("theme")
      } else {
        url.searchParams.set("theme", newTheme)
      }
      window.history.replaceState({}, "", url.toString())

      // Actually apply the theme
      if (newTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        applyTheme(systemTheme)
      } else {
        applyTheme(newTheme)
      }

      setTimeout(() => setIsChanging(false), 150)
    },
    [applyTheme],
  )

  // REAL THEME CYCLING - ACTUALLY CYCLES THROUGH THEMES
  const cycleTheme = useCallback(() => {
    const themes: Theme[] = ["light", "dark", "system"]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    changeTheme(themes[nextIndex])
  }, [theme, changeTheme])

  return {
    theme,
    resolvedTheme,
    isChanging,
    changeTheme,
    cycleTheme,
  }
}
