import { useState, useCallback, useRef } from 'react'
import { streamChat } from '@/lib/chat'
import type { ChatMessageData } from '@/lib/chat'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (text: string) => Promise<void>
  clearHistory: () => void
}

let nextId = 1
function genId(): string {
  return `msg-${nextId++}-${Date.now()}`
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(false)

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setError(null)
    abortRef.current = false

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const assistantId = genId()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsLoading(true)

    // Build history for API (all previous messages + new user message)
    const history: ChatMessageData[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: trimmed },
    ]

    await streamChat(
      history,
      (chunk) => {
        if (abortRef.current) return
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m
          )
        )
      },
      () => {
        setIsLoading(false)
      },
      (err) => {
        setIsLoading(false)
        setError(err.message)
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(m => m.id !== assistantId || m.content !== ''))
      }
    )
  }, [messages, isLoading])

  const clearHistory = useCallback(() => {
    setMessages([])
    setError(null)
    abortRef.current = true
    setIsLoading(false)
  }, [])

  return { messages, isLoading, error, sendMessage, clearHistory }
}
