import type { GrammarRule } from './database'

export interface GrammarTopic {
  id?: string
  title: string
  slug: string
  module_level: number
  category: string
  explanation: string
  rules: GrammarRule[]
  tips: string[]
  common_mistakes: string[]
  sort_order: number
}

export type { GrammarRule }
