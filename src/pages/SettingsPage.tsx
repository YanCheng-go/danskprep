import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SETTINGS_KEYS, DAILY_NEW_CARDS_LIMIT } from '@/lib/constants'
import type { AIProvider } from '@/lib/ai-provider'
import { getProviderConfig, saveProviderConfig, testOllamaConnection, PROVIDER_DEFAULTS } from '@/lib/ai-provider'
import { useTranslation } from '@/lib/i18n'
import { ExternalLink } from 'lucide-react'

export function SettingsPage() {
  const { t } = useTranslation()
  const [dailyLimit, setDailyLimit] = useState(() => {
    const stored = localStorage.getItem(SETTINGS_KEYS.DAILY_NEW_LIMIT)
    return stored ? Number(stored) : DAILY_NEW_CARDS_LIMIT
  })
  const [acceptLatin, setAcceptLatin] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.ACCEPT_LATIN_FALLBACK) !== 'false'
  )
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.DARK_MODE) === 'true'
  )
  const [saved, setSaved] = useState(false)

  // AI provider state
  const [providerConfig] = useState(() => getProviderConfig())
  const [aiProvider, setAiProvider] = useState<AIProvider>(providerConfig.provider)
  const [anthropicKey, setAnthropicKey] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.ANTHROPIC_KEY) ?? ''
  )
  const [ollamaUrl, setOllamaUrl] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.OLLAMA_URL) ?? ''
  )
  const [ollamaModel, setOllamaModel] = useState(
    () => providerConfig.provider === 'ollama' ? providerConfig.model : ''
  )
  const [openrouterKey, setOpenrouterKey] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.OPENROUTER_KEY) ?? ''
  )
  const [openrouterModel, setOpenrouterModel] = useState(
    () => providerConfig.provider === 'openrouter' ? providerConfig.model : ''
  )
  const [openaiKey, setOpenaiKey] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.OPENAI_KEY) ?? ''
  )
  const [openaiModel, setOpenaiModel] = useState(
    () => providerConfig.provider === 'openai' ? providerConfig.model : ''
  )
  const [anthropicModel, setAnthropicModel] = useState(
    () => providerConfig.provider === 'anthropic' ? providerConfig.model : ''
  )
  const [ollamaTestResult, setOllamaTestResult] = useState<string | null>(null)
  const [ollamaTesting, setOllamaTesting] = useState(false)

  function toggleDarkMode(enabled: boolean) {
    setDarkMode(enabled)
    if (enabled) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function handleOllamaTest() {
    setOllamaTesting(true)
    setOllamaTestResult(null)
    const result = await testOllamaConnection(ollamaUrl.trim() || PROVIDER_DEFAULTS.ollama.baseUrl!)
    if (result.ok) {
      setOllamaTestResult(`Connected! Models: ${result.models?.join(', ') ?? 'none'}`)
    } else {
      setOllamaTestResult(`Failed: ${result.error}`)
    }
    setOllamaTesting(false)
  }

  function save() {
    localStorage.setItem(SETTINGS_KEYS.DAILY_NEW_LIMIT, String(dailyLimit))
    localStorage.setItem(SETTINGS_KEYS.ACCEPT_LATIN_FALLBACK, String(acceptLatin))
    localStorage.setItem(SETTINGS_KEYS.DARK_MODE, String(darkMode))

    // Save AI provider config — use provider defaults when fields are left empty
    if (aiProvider === 'anthropic') {
      if (anthropicKey.trim()) {
        localStorage.setItem(SETTINGS_KEYS.ANTHROPIC_KEY, anthropicKey.trim())
      }
      saveProviderConfig({ provider: 'anthropic', apiKey: anthropicKey.trim() || undefined, model: anthropicModel.trim() || PROVIDER_DEFAULTS.anthropic.model })
    } else if (aiProvider === 'ollama') {
      saveProviderConfig({
        provider: 'ollama',
        baseUrl: ollamaUrl.trim() || PROVIDER_DEFAULTS.ollama.baseUrl,
        model: ollamaModel.trim() || PROVIDER_DEFAULTS.ollama.model,
      })
    } else if (aiProvider === 'openrouter') {
      if (openrouterKey.trim()) {
        localStorage.setItem(SETTINGS_KEYS.OPENROUTER_KEY, openrouterKey.trim())
      }
      saveProviderConfig({ provider: 'openrouter', apiKey: openrouterKey.trim() || undefined, model: openrouterModel.trim() || PROVIDER_DEFAULTS.openrouter.model })
    } else if (aiProvider === 'openai') {
      if (openaiKey.trim()) {
        localStorage.setItem(SETTINGS_KEYS.OPENAI_KEY, openaiKey.trim())
      }
      saveProviderConfig({ provider: 'openai', apiKey: openaiKey.trim() || undefined, model: openaiModel.trim() || PROVIDER_DEFAULTS.openai.model })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.dailyCards')}</CardTitle>
            <CardDescription>
              {t('settings.dailyCardsDesc')}
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
                className="flex-1 accent-primary"
              />
              <span className="w-8 text-center font-mono font-medium">{dailyLimit}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.latinFallback')}</CardTitle>
            <CardDescription>
              {t('settings.latinFallbackDesc')}
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
              <span className="text-sm">{t('settings.enableLatin')}</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.darkMode')}</CardTitle>
            <CardDescription>
              {t('settings.darkModeDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={e => toggleDarkMode(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">{t('settings.enableDarkMode')}</span>
            </label>
          </CardContent>
        </Card>

        {/* AI Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.aiProvider')}</CardTitle>
            <CardDescription>
              {t('settings.aiProviderDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider radio buttons */}
            <div className="space-y-2">
              {(['anthropic', 'ollama', 'openrouter', 'openai'] as const).map(provider => (
                <label key={provider} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ai-provider"
                    value={provider}
                    checked={aiProvider === provider}
                    onChange={() => setAiProvider(provider)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">{t(`settings.provider.${provider}`)}</span>
                    <p className="text-xs text-muted-foreground">{t(`settings.provider.${provider}Desc`)}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Anthropic config */}
            {aiProvider === 'anthropic' && (
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-medium">{t('settings.apiKey')}</label>
                <Input
                  type="password"
                  value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="font-mono text-sm"
                />
                <label className="text-xs font-medium">{t('settings.model')}</label>
                <Input
                  value={anthropicModel}
                  onChange={e => setAnthropicModel(e.target.value)}
                  placeholder="claude-haiku-4-5-20251001"
                  className="font-mono text-sm"
                />
                <a
                  href="https://platform.claude.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Get your API key <ExternalLink className="h-3 w-3" />
                </a>
                {anthropicKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      localStorage.removeItem(SETTINGS_KEYS.ANTHROPIC_KEY)
                      setAnthropicKey('')
                    }}
                  >
                    {t('settings.remove')}
                  </Button>
                )}
              </div>
            )}

            {/* Ollama config */}
            {aiProvider === 'ollama' && (
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-medium">{t('settings.ollamaUrl')}</label>
                <Input
                  value={ollamaUrl}
                  onChange={e => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="font-mono text-sm"
                />
                <label className="text-xs font-medium">{t('settings.model')}</label>
                <Input
                  value={ollamaModel}
                  onChange={e => setOllamaModel(e.target.value)}
                  placeholder="llama3.1"
                  className="font-mono text-sm"
                />
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOllamaTest}
                    disabled={ollamaTesting}
                  >
                    {ollamaTesting ? t('settings.testing') : t('settings.testConnection')}
                  </Button>
                  <a
                    href="https://docs.ollama.com/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ollama installation guide <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {ollamaTestResult && (
                  <p className="text-xs text-muted-foreground">{ollamaTestResult}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('settings.ollamaLocalOnly')}</p>
              </div>
            )}

            {/* OpenRouter config */}
            {aiProvider === 'openrouter' && (
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-medium">{t('settings.apiKey')}</label>
                <Input
                  type="password"
                  value={openrouterKey}
                  onChange={e => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="font-mono text-sm"
                />
                <label className="text-xs font-medium">{t('settings.model')}</label>
                <Input
                  value={openrouterModel}
                  onChange={e => setOpenrouterModel(e.target.value)}
                  placeholder="qwen/qwen3-80b:free"
                  className="font-mono text-sm"
                />
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  OpenRouter — browse models & get API key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* OpenAI config */}
            {aiProvider === 'openai' && (
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-medium">{t('settings.apiKey')}</label>
                <Input
                  type="password"
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-sm"
                />
                <label className="text-xs font-medium">{t('settings.model')}</label>
                <Input
                  value={openaiModel}
                  onChange={e => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="font-mono text-sm"
                />
                <a
                  href="https://openai.com/index/openai-api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  OpenAI API — get your API key <ExternalLink className="h-3 w-3" />
                </a>
                {openaiKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      localStorage.removeItem(SETTINGS_KEYS.OPENAI_KEY)
                      setOpenaiKey('')
                    }}
                  >
                    {t('settings.remove')}
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {t('settings.aiKeyNote')}
            </p>
          </CardContent>
        </Card>

        <Button onClick={save} className="w-full">
          {saved ? t('settings.saved') : t('settings.save')}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {t('settings.moduleNote')}
        </p>

      </div>
    </PageContainer>
  )
}
