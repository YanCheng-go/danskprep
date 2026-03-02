import { useState, useEffect } from 'react'
import { ChatPanel } from './ChatPanel'
import { useChat } from '@/hooks/useChat'
import { useTranslation } from '@/lib/i18n'

/** Inline cartoon robot mascot SVG */
function RobotMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Antenna */}
      <circle cx="32" cy="6" r="4" fill="#fbbf24" />
      <rect x="30" y="10" width="4" height="8" rx="2" fill="#94a3b8" />
      {/* Head */}
      <rect x="12" y="18" width="40" height="28" rx="8" fill="white" />
      {/* Eyes */}
      <circle cx="24" cy="32" r="5" fill="#3b82f6" />
      <circle cx="40" cy="32" r="5" fill="#3b82f6" />
      <circle cx="25.5" cy="30.5" r="1.5" fill="white" />
      <circle cx="41.5" cy="30.5" r="1.5" fill="white" />
      {/* Mouth — smile */}
      <path d="M24 40 Q32 46 40 40" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Body */}
      <rect x="18" y="48" width="28" height="12" rx="4" fill="white" opacity="0.85" />
      {/* Arms */}
      <rect x="6" y="50" width="10" height="4" rx="2" fill="#94a3b8" />
      <rect x="48" y="50" width="10" height="4" rx="2" fill="#94a3b8" />
    </svg>
  )
}

export function ChatButton() {
  const [open, setOpen] = useState(false)
  const [showPing, setShowPing] = useState(true)
  const chat = useChat()
  const { t } = useTranslation()

  // Stop ping animation after 4 seconds (once per session)
  useEffect(() => {
    const timer = setTimeout(() => setShowPing(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {open && (
        <ChatPanel chat={chat} onClose={() => setOpen(false)} />
      )}

      <button
        onClick={() => { setOpen(o => !o); setShowPing(false) }}
        className="fixed bottom-6 right-4 sm:right-6 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 pl-3 pr-4 py-2.5 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
        title={t('chat.title')}
      >
        {/* Ping ring — shown once per session */}
        {showPing && !open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
        )}
        <RobotMascot className="h-7 w-7 relative" />
        <span className="hidden sm:inline text-sm font-medium relative">AI Tutor</span>
      </button>
    </>
  )
}
