"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect gallery page to harvests page since we've consolidated the functionality
export default function GalleryRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/harvests")
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 harvest-gradient rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-6 h-6 bg-white rounded-full animate-pulse" />
        </div>
        <p className="text-organic">Redirecting to enhanced harvest gallery...</p>
      </div>
    </div>
  )
}