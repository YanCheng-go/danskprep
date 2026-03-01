# Skill: Supabase Integration

## Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

## Type Generation

After any schema change, regenerate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Always use the generated `Database` type with `createClient<Database>()` for full type safety.

## Authentication

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, session, isLoading, signUp, signIn, signOut };
}
```

## Row Level Security (RLS) Policies

Full RLS SQL is in `database-schema.md`. Summary:
- Content tables (`words`, `grammar_topics`, `exercises`, `sentences`): SELECT for `auth.role() = 'authenticated'`
- User tables (`user_cards`, `review_logs`): SELECT/INSERT/UPDATE restricted to `auth.uid() = user_id`

Always apply RLS in the migration file, never from client code.

## Data Access Patterns

### Fetching vocabulary with filters

```typescript
export async function getWordsByModule(moduleLevel: number, pos?: string) {
  let query = supabase
    .from('words')
    .select('*')
    .eq('module_level', moduleLevel)
    .order('danish', { ascending: true });

  if (pos) {
    query = query.eq('part_of_speech', pos);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### Fetching due cards with joined content

```typescript
export async function getDueCards(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('user_cards')
    .select(`
      *,
      word:words(*),
      exercise:exercises(*, grammar_topic:grammar_topics(*))
    `)
    .eq('user_id', userId)
    .lte('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

### Upserting card state after review

```typescript
export async function upsertCardState(card: Partial<UserCard> & { user_id: string; card_ref_id: string; card_type: string }) {
  const { data, error } = await supabase
    .from('user_cards')
    .upsert(
      { ...card, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,card_type,card_ref_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Logging a review

```typescript
export async function logReview(log: {
  user_card_id: string;
  user_id: string;
  rating: number;
  response?: string;
  was_correct: boolean;
  time_taken_ms?: number;
}) {
  const { error } = await supabase.from('review_logs').insert(log);
  if (error) throw error;
}
```

### Getting progress stats

```typescript
export async function getProgressStats(userId: string) {
  const { data, error } = await supabase
    .from('user_cards')
    .select('state, card_type, correct_count, incorrect_count')
    .eq('user_id', userId);

  if (error) throw error;

  return {
    total: data.length,
    new: data.filter(c => c.state === 0).length,
    learning: data.filter(c => c.state === 1 || c.state === 3).length,
    review: data.filter(c => c.state === 2).length,
    accuracy: data.reduce((sum, c) => sum + c.correct_count, 0) /
              Math.max(1, data.reduce((sum, c) => sum + c.correct_count + c.incorrect_count, 0)),
  };
}
```

## Initializing New User Cards

When a user first opens a vocabulary or grammar topic, create card entries for all items they haven't seen:

```typescript
export async function initializeCardsForModule(userId: string, moduleLevel: number) {
  // Get all words for this module
  const { data: words } = await supabase
    .from('words')
    .select('id')
    .eq('module_level', moduleLevel);

  // Get existing cards for this user
  const { data: existingCards } = await supabase
    .from('user_cards')
    .select('card_ref_id')
    .eq('user_id', userId)
    .eq('card_type', 'word');

  const existingIds = new Set(existingCards?.map(c => c.card_ref_id) ?? []);

  // Create cards for words the user hasn't seen
  const newCards = words
    ?.filter(w => !existingIds.has(w.id))
    .map(w => ({
      user_id: userId,
      card_type: 'word' as const,
      card_ref_id: w.id,
      state: 0,
      difficulty: 0,
      stability: 0,
      retrievability: 0,
      due: new Date().toISOString(),
    }));

  if (newCards?.length) {
    const { error } = await supabase.from('user_cards').insert(newCards);
    if (error) throw error;
  }
}
```

> Enforced rules for Supabase usage are in `.claude/rules/supabase-patterns.md` (auto-attached when editing hooks, supabase files, or scripts).
