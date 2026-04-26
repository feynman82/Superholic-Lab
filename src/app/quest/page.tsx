/**
 * src/app/quest/page.tsx
 * Thin server component — passes searchParams to QuestClient.
 * All data fetching and auth happens client-side (no @supabase/ssr installed).
 */

import { QuestClient } from "./QuestClient"

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default function QuestPage({ searchParams }: PageProps) {
  return <QuestClient searchParams={searchParams} />
}
