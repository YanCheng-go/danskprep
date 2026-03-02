import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, List, Sparkles, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import changelogData from '@/data/seed/changelog.json'

interface ChangelogEntry {
  version: string
  date: string
  title: string
  highlights: string[]
  stats: Record<string, number>
}

const changelog = changelogData as ChangelogEntry[]
const latest = changelog[0]

// Session-only dismiss — reappears on next page load / session

interface WhatsNewProps {
  /** When true, always show (no dismiss button). Used for the Updates page. */
  alwaysShow?: boolean
}

export function WhatsNew({ alwaysShow = false }: WhatsNewProps) {
  const [visible, setVisible] = useState(true)
  const { t } = useTranslation()

  if (!visible && !alwaysShow) return null

  function handleDismiss() {
    setVisible(false)
  }

  return (
    <Card className="relative border-primary/30 bg-primary/5 dark:bg-primary/10">
      {!alwaysShow && (
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('updates.dismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <CardContent className="pt-5 pb-5 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {latest.title}
            </h2>
            <Badge variant="secondary" className="text-xs">v{latest.version}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{latest.date}</p>
        </div>

        {/* Highlights */}
        <ul className="space-y-1">
          {latest.highlights.map((h, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              {h}
            </li>
          ))}
        </ul>

        {/* Stats row */}
        {latest.stats && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(latest.stats).map(([key, value]) => (
              <div key={key} className="rounded-md border bg-background px-3 py-1.5 text-center">
                <p className="text-sm font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/quiz"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'gap-1.5'
            )}
          >
            <List className="h-3.5 w-3.5" />
            {t('updates.tryQuiz')}
          </Link>
          <Link
            to="/drill"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5'
            )}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            {t('updates.tryDrill')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

/** Full changelog component for the Updates page */
export function FullChangelog() {
  return (
    <div className="space-y-6">
      {changelog.map(entry => (
        <Card key={entry.version}>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{entry.title}</h3>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
              <Badge variant="outline">v{entry.version}</Badge>
            </div>
            <ul className="space-y-1">
              {entry.highlights.map((h, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 shrink-0">•</span>
                  {h}
                </li>
              ))}
            </ul>
            {entry.stats && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(entry.stats).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {value} {key.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
