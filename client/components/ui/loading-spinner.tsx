import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
}

export function LoadingCard({ title = "Loading...", description }: LoadingCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <LoadingSpinner size="lg" className="mb-4" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  )
}

export function LoadingList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}