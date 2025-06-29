import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import ErrorBoundary from "@/components/ui/error-boundary"
import { Navigation } from "@/components/navigation"
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
          <div className="min-h-screen bg-background">
            {/* Global Navigation */}
            <header className="bg-card border-b border-border/50 sticky top-0 z-50">
              <div className="max-w-2xl mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 harvest-gradient rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">H</span>
                    </div>
                    <h1 className="text-lg font-bold text-foreground">Harvest Log</h1>
                  </Link>
                  <Navigation />
                </div>
              </div>
            </header>
            
            {/* Page Content */}
            <main>
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
