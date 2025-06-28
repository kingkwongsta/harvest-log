import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import ErrorBoundary from "@/components/ui/error-boundary"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "My Harvest Log",
  description: "Personal garden harvest tracker",
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
