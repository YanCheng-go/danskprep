/**
 * Unified AI provider abstraction.
 * Supports Anthropic (cloud), Ollama (local), and OpenRouter (cloud, OpenAI-compat).
 */

import type { ChatMessageData } from './chat'
import { SETTINGS_KEYS } from './constants'

export type AIProvider = 'anthropic' | 'ollama' | 'openrouter'

export interface ProviderConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  model: string
}

const PROVIDER_DEFAULTS: Record<AIProvider, { model: string; baseUrl?: string }> = {
  anthropic: { model: 'claude-haiku-4-5-20251001' },
  ollama: { model: 'llama3.1', baseUrl: 'http://localhost:11434' },
  openrouter: { model: 'qwen/qwen3-80b:free' },
}

// ── Config persistence ─────────────────────────────────────────────────────

export function getProviderConfig(): ProviderConfig {
  const provider = (localStorage.getItem(SETTINGS_KEYS.AI_PROVIDER) ?? 'anthropic') as AIProvider
  const model = localStorage.getItem(SETTINGS_KEYS.AI_MODEL) ?? PROVIDER_DEFAULTS[provider].model

  if (provider === 'ollama') {
    return {
      provider,
      baseUrl: localStorage.getItem(SETTINGS_KEYS.OLLAMA_URL) ?? PROVIDER_DEFAULTS.ollama.baseUrl,
      model,
    }
  }

  if (provider === 'openrouter') {
    return {
      provider,
      apiKey: localStorage.getItem(SETTINGS_KEYS.OPENROUTER_KEY) ?? undefined,
      model,
    }
  }

  // Anthropic (default)
  return {
    provider,
    apiKey: localStorage.getItem(SETTINGS_KEYS.ANTHROPIC_KEY) ?? undefined,
    model,
  }
}

export function saveProviderConfig(config: ProviderConfig): void {
  localStorage.setItem(SETTINGS_KEYS.AI_PROVIDER, config.provider)
  localStorage.setItem(SETTINGS_KEYS.AI_MODEL, config.model)

  if (config.provider === 'ollama' && config.baseUrl) {
    localStorage.setItem(SETTINGS_KEYS.OLLAMA_URL, config.baseUrl)
  }
  if (config.provider === 'openrouter' && config.apiKey) {
    localStorage.setItem(SETTINGS_KEYS.OPENROUTER_KEY, config.apiKey)
  }
  if (config.provider === 'anthropic' && config.apiKey) {
    localStorage.setItem(SETTINGS_KEYS.ANTHROPIC_KEY, config.apiKey)
  }
}

// ── Non-streaming completion ────────────────────────────────────────────────

export async function aiComplete(system: string, userMessage: string): Promise<string> {
  const config = getProviderConfig()

  switch (config.provider) {
    case 'anthropic':
      return anthropicComplete(config, system, userMessage)
    case 'ollama':
      return ollamaComplete(config, system, userMessage)
    case 'openrouter':
      return openrouterComplete(config, system, userMessage)
  }
}

// ── Streaming completion ────────────────────────────────────────────────────

export async function aiStream(
  system: string,
  messages: ChatMessageData[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const config = getProviderConfig()

  switch (config.provider) {
    case 'anthropic':
      return anthropicStream(config, system, messages, onChunk, onDone, onError)
    case 'ollama':
      return ollamaStream(config, system, messages, onChunk, onDone, onError)
    case 'openrouter':
      return openrouterStream(config, system, messages, onChunk, onDone, onError)
  }
}

// ── Ollama connection test ──────────────────────────────────────────────────

export async function testOllamaConnection(baseUrl: string): Promise<{ ok: boolean; models?: string[]; error?: string }> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = await res.json()
    const models = (data.models ?? []).map((m: { name: string }) => m.name) as string[]
    return { ok: true, models }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' }
  }
}

// ── Anthropic implementation ────────────────────────────────────────────────

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function anthropicHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  }
}

async function anthropicComplete(config: ProviderConfig, system: string, userMessage: string): Promise<string> {
  if (!config.apiKey) throw new Error('No Anthropic API key configured. Add it in Settings.')

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: anthropicHeaders(config.apiKey),
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function anthropicStream(
  config: ProviderConfig,
  system: string,
  messages: ChatMessageData[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!config.apiKey) {
    onError(new Error('No Anthropic API key configured. Add it in Settings.'))
    return
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: anthropicHeaders(config.apiKey),
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        stream: true,
        system,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      onError(new Error(`Anthropic API error ${res.status}: ${body}`))
      return
    }

    await readSSE(res, (data) => {
      const event = JSON.parse(data)
      if (event.type === 'content_block_delta' && event.delta?.text) {
        onChunk(event.delta.text)
      }
    })

    onDone()
  } catch (err) {
    onError(err instanceof Error ? err : new Error('Anthropic request failed'))
  }
}

// ── Ollama implementation ───────────────────────────────────────────────────

function ollamaMessages(system: string, messages: ChatMessageData[]) {
  return [
    { role: 'system', content: system },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ]
}

async function ollamaComplete(config: ProviderConfig, system: string, userMessage: string): Promise<string> {
  const baseUrl = config.baseUrl ?? 'http://localhost:11434'
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: ollamaMessages(system, [{ role: 'user', content: userMessage }]),
      stream: false,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Ollama error ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.message?.content ?? ''
}

async function ollamaStream(
  config: ProviderConfig,
  system: string,
  messages: ChatMessageData[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const baseUrl = config.baseUrl ?? 'http://localhost:11434'

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: ollamaMessages(system, messages),
        stream: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      onError(new Error(`Ollama error ${res.status}: ${body}`))
      return
    }

    // Ollama streams NDJSON (one JSON object per line)
    const reader = res.body?.getReader()
    if (!reader) { onError(new Error('No response body')); return }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line)
          if (obj.message?.content) {
            onChunk(obj.message.content)
          }
        } catch {
          // Skip malformed lines
        }
      }
    }

    onDone()
  } catch (err) {
    onError(err instanceof Error ? err : new Error('Ollama request failed'))
  }
}

// ── OpenRouter implementation ───────────────────────────────────────────────

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function openrouterMessages(system: string, messages: ChatMessageData[]) {
  return [
    { role: 'system', content: system },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ]
}

async function openrouterComplete(config: ProviderConfig, system: string, userMessage: string): Promise<string> {
  if (!config.apiKey) throw new Error('No OpenRouter API key configured. Add it in Settings.')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: openrouterMessages(system, [{ role: 'user', content: userMessage }]),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function openrouterStream(
  config: ProviderConfig,
  system: string,
  messages: ChatMessageData[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!config.apiKey) {
    onError(new Error('No OpenRouter API key configured. Add it in Settings.'))
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: openrouterMessages(system, messages),
        stream: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      onError(new Error(`OpenRouter error ${res.status}: ${body}`))
      return
    }

    // OpenAI-compatible SSE format
    await readSSE(res, (data) => {
      if (data === '[DONE]') return
      const event = JSON.parse(data)
      const content = event.choices?.[0]?.delta?.content
      if (content) onChunk(content)
    })

    onDone()
  } catch (err) {
    onError(err instanceof Error ? err : new Error('OpenRouter request failed'))
  }
}

// ── SSE reader utility ──────────────────────────────────────────────────────

async function readSSE(res: Response, onData: (data: string) => void): Promise<void> {
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      try {
        onData(data)
      } catch {
        // Skip unparseable events
      }
    }
  }
}
