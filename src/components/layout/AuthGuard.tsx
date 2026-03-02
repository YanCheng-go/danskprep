interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Guest mode: all users can access the app without signing in.
 * Auth is still available for Supabase FSRS persistence but not required.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>
}
