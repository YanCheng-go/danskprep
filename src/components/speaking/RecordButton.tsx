import { Button } from '@/components/ui/button'
import { Mic, Square } from 'lucide-react'

interface RecordButtonProps {
  isRecording: boolean
  duration: number
  onStart: () => void
  onStop: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function RecordButton({ isRecording, duration, onStart, onStop }: RecordButtonProps) {
  if (isRecording) {
    return (
      <div className="flex items-center gap-3">
        <Button
          onClick={onStop}
          variant="destructive"
          size="lg"
          className="gap-2"
        >
          <Square className="h-4 w-4 fill-current" />
          Stop
        </Button>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-sm">{formatDuration(duration)}</span>
        </div>
      </div>
    )
  }

  return (
    <Button onClick={onStart} size="lg" className="gap-2">
      <Mic className="h-4 w-4" />
      Start recording
    </Button>
  )
}
