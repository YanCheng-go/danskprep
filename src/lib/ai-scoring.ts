/**
 * AI scoring for writing and speaking exercises.
 * Uses the unified AI provider abstraction for multi-provider support.
 */

import { aiComplete, getProviderConfig, saveProviderConfig } from './ai-provider'
import { SETTINGS_KEYS } from './constants'

// ── Backward-compatible API key helpers ────────────────────────────────────
// These delegate to the provider config for Anthropic, keeping existing
// callsites (SettingsPage, chat noApiKey check) working during transition.

export function getApiKey(): string | null {
  const config = getProviderConfig()
  return config.apiKey ?? null
}

export function setApiKey(key: string): void {
  localStorage.setItem(SETTINGS_KEYS.ANTHROPIC_KEY, key)
  // Also update provider config if currently on Anthropic
  const config = getProviderConfig()
  if (config.provider === 'anthropic') {
    saveProviderConfig({ ...config, apiKey: key })
  }
}

export function clearApiKey(): void {
  localStorage.removeItem(SETTINGS_KEYS.ANTHROPIC_KEY)
}

export function hasAIProvider(): boolean {
  const config = getProviderConfig()
  if (config.provider === 'ollama') return true // No key needed
  return !!config.apiKey
}

export interface WritingScore {
  overall: number        // 1-5
  grammar: number        // 1-5
  vocabulary: number     // 1-5
  taskCompletion: number // 1-5
  corrections: Array<{
    original: string
    corrected: string
    explanation: string
  }>
  feedback: string       // General feedback paragraph
}

const SCORING_SYSTEM_PROMPT = `You are a Danish language exam grader for the Prøve i Dansk 3 (PD3) exam, Module 2 level.
Score the student's writing on a 1-5 scale in each category:
- Grammar: V2 rule compliance, article usage (en/et), verb tense correctness, adjective inflection, pronoun case
- Vocabulary: Range and appropriateness for PD3M2 level
- Task completion: Did they address the prompt fully?

Return ONLY valid JSON in this exact format:
{
  "overall": <1-5>,
  "grammar": <1-5>,
  "vocabulary": <1-5>,
  "taskCompletion": <1-5>,
  "corrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
  "feedback": "..."
}

Be encouraging but honest. Point out specific grammar rules (V2, negation placement, definite suffixes) when correcting. Keep corrections to the most important 5 errors max. Write feedback in English.`

export async function scoreWriting(
  prompt: string,
  response: string
): Promise<WritingScore> {
  const config = getProviderConfig()
  if (config.provider !== 'ollama' && !config.apiKey) {
    throw new Error('No API key configured. Add your API key in Settings.')
  }

  const userMessage = `Writing prompt: "${prompt}"\n\nStudent's response:\n${response}`
  const text = await aiComplete(SCORING_SYSTEM_PROMPT, userMessage)

  // Extract JSON from response (handle possible markdown fencing)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse scoring response')
  }

  return JSON.parse(jsonMatch[0]) as WritingScore
}
