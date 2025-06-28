import { LoadingCard } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <LoadingCard 
          title="Loading..." 
          description="Getting your photos"
        />
      </div>
    </div>
  )
}
