"use client"

import { CheckCircle, AlertCircle, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface EventConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'success' | 'error'
  eventType?: string
  title?: string
  message: string
  imageCount?: number
  onClose?: () => void
}

export function EventConfirmationDialog({
  open,
  onOpenChange,
  type,
  eventType,
  title,
  message,
  imageCount,
  onClose
}: EventConfirmationDialogProps) {
  
  // Debug logging
  console.log('🎨 EventConfirmationDialog render:', { 
    open, 
    type, 
    eventType, 
    message: message?.substring(0, 50) + '...',
    imageCount 
  })
  
  const handleClose = () => {
    onClose?.()
    onOpenChange(false)
  }

  const getEventIcon = (eventType?: string) => {
    switch (eventType) {
      case 'harvest': return '🌾'
      case 'bloom': return '🌸'
      case 'snapshot': return '📏'
      default: return '🌱'
    }
  }

  const getSuccessTitle = () => {
    if (title) return title
    if (eventType) {
      return `${getEventIcon(eventType)} ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Event Logged!`
    }
    return '✅ Event Logged Successfully!'
  }

  const getErrorTitle = () => {
    if (title) return title
    return '❌ Event Logging Failed'
  }

  const getSuccessMessage = () => {
    if (eventType && imageCount && imageCount > 0) {
      return `Your ${eventType} event has been successfully logged with ${imageCount} image${imageCount > 1 ? 's' : ''}. You can now log another event or view your harvest history.`
    }
    if (eventType) {
      return `Your ${eventType} event has been successfully logged. You can now log another event or view your harvest history.`
    }
    return message
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="!text-center space-y-4 items-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {type === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <DialogTitle className="text-xl font-semibold !text-center">
            {type === 'success' ? getSuccessTitle() : getErrorTitle()}
          </DialogTitle>
          
          <DialogDescription className="text-sm text-muted-foreground !text-center">
            {type === 'success' ? getSuccessMessage() : message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleClose}
            className={`min-w-32 ${
              type === 'success' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {type === 'success' ? 'Continue' : 'Try Again'}
          </Button>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  )
} 