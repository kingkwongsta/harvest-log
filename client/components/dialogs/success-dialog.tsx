"use client"

import { CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function SuccessDialog({
  open,
  onOpenChange,
  title = "Success!",
  description = "Your action was completed successfully.",
  actionLabel = "Continue",
  onAction
}: SuccessDialogProps) {
  const handleAction = () => {
    onAction?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="!text-center space-y-4 items-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-lg font-semibold !text-center">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground !text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="!justify-center !flex-row pt-4">
          <Button onClick={handleAction} className="bg-green-600 hover:bg-green-700">
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 