'use client'
import { useEmails } from '@/hooks/useEmails'
import { EmailPageLayout } from '@/components/mail/EmailPageLayout'

export default function SentPage() {
  const props = useEmails('sent')
  return <EmailPageLayout folder="sent" {...props} />
}
