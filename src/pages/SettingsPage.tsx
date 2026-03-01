import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SETTINGS_KEYS, DAILY_NEW_CARDS_LIMIT } from '@/lib/constants'

export function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useState(DAILY_NEW_CARDS_LIMIT)
  const [acceptLatin, setAcceptLatin] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEYS.DAILY_NEW_LIMIT)
    if (stored) setDailyLimit(Number(stored))
    setAcceptLatin(localStorage.getItem(SETTINGS_KEYS.ACCEPT_LATIN_FALLBACK) !== 'false')
  }, [])

  function save() {
    localStorage.setItem(SETTINGS_KEYS.DAILY_NEW_LIMIT, String(dailyLimit))
    localStorage.setItem(SETTINGS_KEYS.ACCEPT_LATIN_FALLBACK, String(acceptLatin))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily New Cards</CardTitle>
            <CardDescription>
              How many new cards to introduce each day (1–50)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={50}
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center font-mono font-medium">{dailyLimit}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accept Latin Fallback</CardTitle>
            <CardDescription>
              Accept ae/oe/aa as alternatives to æ/ø/å in type-answer exercises
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptLatin}
                onChange={e => setAcceptLatin(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Enable Latin fallback (ae → æ, oe → ø, aa → å)</span>
            </label>
          </CardContent>
        </Card>

        <Button onClick={save} className="w-full">
          {saved ? '✓ Saved!' : 'Save settings'}
        </Button>
      </div>
    </PageContainer>
  )
}
