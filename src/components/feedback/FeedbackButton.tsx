import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FeedbackDialog } from './FeedbackDialog'

interface FeedbackButtonProps {
  exerciseId?: string
  /** Show full label instead of icon-only. Default: false */
  showLabel?: boolean
}

export function FeedbackButton({ exerciseId, showLabel }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {showLabel ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground"
          >
            <Flag className="h-4 w-4" />
            Report issue
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            aria-label="Report issue with this exercise"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="text-xs">Report</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <FeedbackDialog
          exerciseId={exerciseId}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
