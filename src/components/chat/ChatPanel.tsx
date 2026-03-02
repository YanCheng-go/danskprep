import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from './ChatMessage'
import { hasAIProvider } from '@/lib/ai-scoring'
import { DANISH_CHARS } from '@/lib/danish-input'
import type { UseChatReturn } from '@/hooks/useChat'
import { useTranslation } from '@/lib/i18n'

interface ChatPanelProps {
  chat: UseChatReturn
  onClose: () => void
}

const STARTERS = [
  'Explain the V2 rule',
  'How do I use "at"?',
  'en vs et — when to use which?',
  'Practice a conversation',
]

export function ChatPanel({ chat, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasApiKey = hasAIProvider()
  const { t } = useTranslation()

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Auto-focus textarea when panel opens
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || chat.isLoading) return
    chat.sendMessage(trimmed)
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function insertChar(char: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + char + el.value.slice(end)
    setInput(next)
    // Restore focus + cursor after React re-render
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + char.length, start + char.length)
    })
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[32rem] flex flex-col rounded-2xl border bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <h2 className="font-semibold text-sm">{t('chat.title')}</h2>
        <div className="flex items-center gap-1">
          {chat.messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={chat.clearHistory}
              title={t('chat.clearChat')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[12rem]">
        {!hasApiKey && (
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {t('chat.noApiKey', { link: '' })}
            <Link to="/settings" className="underline font-medium text-foreground" onClick={onClose}>
              {t('chat.noApiKeyLink')}
            </Link>
          </div>
        )}

        {chat.messages.length === 0 && hasApiKey && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('chat.welcome')}
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => chat.sendMessage(s)}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLoading={chat.isLoading && i === chat.messages.length - 1 && msg.role === 'assistant'}
          />
        ))}

        {chat.error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {chat.error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {hasApiKey && (
        <div className="border-t p-3 shrink-0 space-y-2">
          <div className="flex gap-1">
            {DANISH_CHARS.map(char => (
              <button
                key={char}
                type="button"
                onClick={() => insertChar(char)}
                className="rounded border px-2 py-1 text-xs font-mono hover:bg-muted transition-colors"
              >
                {char}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              rows={1}
              disabled={chat.isLoading}
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || chat.isLoading}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
