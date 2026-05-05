'use client'
import { useEmails } from '@/hooks/useEmails'
import { EmailPageLayout } from '@/components/mail/EmailPageLayout'

export default function DraftsPage() {
  const props = useEmails('drafts')
  return <EmailPageLayout folder="drafts" {...props} />
}
