import { useState, useCallback } from 'react'
import {
  loadUserExercises,
  addUserExercise,
  deleteUserExercise,
} from '@/lib/user-exercises'
import type { UserExercise } from '@/lib/user-exercises'

export function useUserExercises() {
  const [exercises, setExercises] = useState<UserExercise[]>(() => loadUserExercises())

  const add = useCallback(
    (data: Omit<UserExercise, 'id' | 'source' | 'created_at'>) => {
      const created = addUserExercise(data)
      setExercises(prev => [...prev, created])
      return created
    },
    []
  )

  const remove = useCallback((id: string) => {
    deleteUserExercise(id)
    setExercises(prev => prev.filter(e => e.id !== id))
  }, [])

  const refresh = useCallback(() => {
    setExercises(loadUserExercises())
  }, [])

  return { exercises, add, remove, refresh }
}
