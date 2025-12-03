import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FunctionalThemeToggle } from "@/components/functional-theme-toggle" // ← NAMED (this is how the file exports it)

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PC Banai - স্বপ্ন হবে বাস্তব",
  description: "Bangladesh's premier PC building platform with real-time price comparison and compatibility checking",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">PC Banai</h1>
              <span className="text-sm text-blue-600 bengali-text">স্বপ্ন হবে বাস্তব</span>
            </div>
            <FunctionalThemeToggle />
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
