import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import ErrorBoundary from "@/components/ui/error-boundary"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Harvest Log - Track Your Garden",
  description: "Simple personal harvest logging for your garden",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
