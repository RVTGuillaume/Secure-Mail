import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatEmailDate(dateString: string): string {
  // MongoDB renvoie les dates sans 'Z' → JavaScript les interprète
  // en heure locale au lieu de UTC → décalage de +3h pour Madagascar.
  // On force l'interprétation UTC en ajoutant 'Z' si absent.
  const normalized = dateString.endsWith('Z') ? dateString : dateString + 'Z'
  const date = new Date(normalized)
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffHours < 1) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }
  if (diffHours < 24) {
    return format(date, 'HH:mm', { locale: fr })
  }
  if (diffHours < 168) {
    return format(date, 'EEEE HH:mm', { locale: fr })
  }
  return format(date, 'dd MMM yyyy', { locale: fr })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function extractEmailPreview(text: string, maxLength = 80): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > maxLength ? clean.slice(0, maxLength) + '...' : clean
}

export function isEncryptedEmail(bodyText: string): boolean {
  return bodyText.includes('-----BEGIN PGP MESSAGE-----')
}

export function extractSenderName(fromAddress: string): string {
  const match = fromAddress.match(/^(.+?)\s*</)
  if (match) return match[1].trim()
  return fromAddress.split('@')[0]
}