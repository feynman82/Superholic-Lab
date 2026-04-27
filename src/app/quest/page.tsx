/**
 * src/app/quest/page.tsx
 * Thin server component — awaits searchParams (Next.js 15 async) then
 * passes the resolved params to QuestClient.
 * All data fetching and auth happens client-side.
 */

import { QuestClient } from "./QuestClient"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function QuestPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <QuestClient searchParams={params} />
}
