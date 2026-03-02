import { Coffee } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useTranslation } from '@/lib/i18n'

// Hardcoded — not in i18n translations to reduce exposure if site is compromised
const MOBILEPAY_NUMBER = ['+45', '5272', '8520'].join(' ')

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-pink-500" />
            {t('support.dialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('support.dialogDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-lg border-2 border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950 px-6 py-3">
            <p className="text-2xl font-bold tracking-wider text-center select-all">{MOBILEPAY_NUMBER}</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">{t('support.thankYou')}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
