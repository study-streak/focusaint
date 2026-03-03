import QuickModePage from '@/components/quick-mode/quick-mode-page'
import { COOKIE_NAME } from '@/lib/auth-cookie'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type StudyPageProps = {
  searchParams: Promise<{ url?: string }>
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  const { url } = await searchParams

  const cookieStore = await cookies()
  const authToken = cookieStore.get(COOKIE_NAME)?.value

  if (!authToken) {
    const nextPath = url ? `/study?url=${encodeURIComponent(url)}` : '/study'
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  return <QuickModePage initialUrl={url || ''} />
}
