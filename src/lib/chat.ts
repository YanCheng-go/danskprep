/**
 * Chat library for the Danish Tutor chatbot.
 * Uses the unified AI provider abstraction for multi-provider streaming.
 */

import { aiStream } from './ai-provider'
import { hasAIProvider } from './ai-scoring'

const CHAT_SYSTEM_PROMPT = `You are a Danish language tutor helping a student prepare for the Prøve i Dansk 3 (PD3) exam, Module 2 level.

Your capabilities:
- Explain Danish grammar rules (V2 word order, en/et nouns, verb tenses, adjective inflection, pronouns)
- Help with vocabulary and provide example sentences
- Practice conversation in Danish (adjusting to PD3M2 level)
- Correct grammar mistakes with explanations
- Translate between Danish and English

Rules:
- Keep explanations clear and concise
- Use both Danish and English in responses
- When correcting, always explain the grammar rule behind the correction
- For vocabulary, include the word's gender (en/et) for nouns and key inflections
- Respond in English by default, switch to Danish when the student writes in Danish
- Keep responses focused and relatively short (1-3 paragraphs max unless the student asks for detail)`

export interface ChatMessageData {
  role: 'user' | 'assistant'
  content: string
}

export async function streamChat(
  messages: ChatMessageData[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!hasAIProvider()) {
    onError(new Error('No AI provider configured. Set up a provider in Settings.'))
    return
  }

  await aiStream(CHAT_SYSTEM_PROMPT, messages, onChunk, onDone, onError)
}
