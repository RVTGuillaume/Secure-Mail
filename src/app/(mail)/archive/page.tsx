'use client'
import { useEmails } from '@/hooks/useEmails'
import { EmailPageLayout } from '@/components/mail/EmailPageLayout'

export default function ArchivePage() {
  const props = useEmails('archive')
  return <EmailPageLayout folder="archive" {...props} />
}
