'use client'
import { useEmails } from '@/hooks/useEmails'
import { EmailPageLayout } from '@/components/mail/EmailPageLayout'

export default function TrashPage() {
  const props = useEmails('trash')
  return <EmailPageLayout folder="trash" {...props} />
}
