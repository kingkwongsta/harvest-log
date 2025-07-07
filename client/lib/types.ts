// Shared TypeScript type definitions for the Plant Journey application

// Common form interfaces
export interface HarvestForm {
  fruit: string
  customFruit: string
  quantity: string
  weight: string
  date: string
  notes: string
}

export interface DetailedHarvestForm {
  fruit: string
  variety: string
  quantity: string
  weight: string
  date: string
  notes: string
}

// Camera and image related types
export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  convertToWebP?: boolean
}

export interface CompressionResult {
  originalFile: File
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: string
  savings: number
}

export interface CompressionStats {
  originalSize: number
  compressedSize: number
  compressionRatio: string
}

// UI component props
export interface LoadingProps {
  title?: string
  description?: string
  size?: "sm" | "md" | "lg"
}

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
}

export interface CameraProps extends DialogProps {
  onCapture: (file: File) => void
}

// Form validation types
export type FormErrors<T> = Partial<Record<keyof T, string>>

// API response helpers
export type AsyncResult<T> = {
  success: boolean
  data?: T
  error?: string
}

// Component state types
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// Filter and search types
export interface FilterOptions {
  searchTerm: string
  sortBy: 'date' | 'crop' | 'quantity'
  sortOrder: 'asc' | 'desc'
  dateRange?: {
    start: Date
    end: Date
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Re-export API types for convenience
export type {
  HarvestLogData,  // Legacy interface
  HarvestImage,
  ApiResponse,
  HarvestLogResponse,  // Legacy interface
  HarvestStats,
  ImageUploadResponse,
  MultipleImageUploadResponse
} from './api'