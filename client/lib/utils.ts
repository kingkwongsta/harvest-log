import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clean image URLs by removing trailing query parameters that cause Next.js Image issues
 * This fixes issues with Supabase URLs that end with trailing ? or empty query params
 */
export function cleanImageUrl(url: string | undefined | null): string {
  if (!url) return "/placeholder.svg"
  
  // Remove trailing ? and empty query parameters
  let cleanedUrl = url.trim()
  
  // Remove trailing ? 
  if (cleanedUrl.endsWith('?')) {
    cleanedUrl = cleanedUrl.slice(0, -1)
  }
  
  // Remove empty query parameters like "?&" or "?="
  if (cleanedUrl.includes('?')) {
    const [baseUrl, queryString] = cleanedUrl.split('?')
    
    // If query string is empty or only contains empty params, remove it
    if (!queryString || queryString.trim() === '' || queryString === '&' || queryString === '=') {
      cleanedUrl = baseUrl
    }
  }
  
  return cleanedUrl || "/placeholder.svg"
}
