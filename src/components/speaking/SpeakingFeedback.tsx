import { WritingFeedback } from '@/components/writing/WritingFeedback'
import type { WritingScore } from '@/lib/ai-scoring'

interface SpeakingFeedbackProps {
  score: WritingScore
}

/** Reuses WritingFeedback — same scoring categories apply to transcribed speech */
export function SpeakingFeedback({ score }: SpeakingFeedbackProps) {
  return <WritingFeedback score={score} />
}
