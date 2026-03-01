import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn('max-w-2xl mx-auto px-4 py-6', className)}>
      {children}
    </main>
  )
}
