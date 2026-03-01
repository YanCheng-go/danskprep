import { useRef } from 'react'
import { Input } from './input'
import { Button } from './button'
import { insertAtCursor, DANISH_CHARS } from '@/lib/danish-input'
import { cn } from '@/lib/utils'

interface DanishInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  disabled?: boolean
}

export function DanishInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your answer…',
  className,
  autoFocus,
  disabled,
}: DanishInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSpecialChar(char: string) {
    if (!inputRef.current) return
    inputRef.current.focus()
    insertAtCursor(inputRef.current, char)
    // Read the updated value back
    onChange(inputRef.current.value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className="text-base"
      />
      {/* Danish character virtual keys */}
      <div className="flex gap-2">
        {DANISH_CHARS.map(char => (
          <Button
            key={char}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSpecialChar(char)}
            disabled={disabled}
            className="font-mono text-base min-h-9"
          >
            {char}
          </Button>
        ))}
      </div>
    </div>
  )
}
