'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AttachmentResponse } from '@/types'
import { formatFileSize } from '@/lib/utils'
import { Paperclip, Download, Loader2 } from 'lucide-react'

interface AttachmentListProps {
  emailId: string
}

export function AttachmentList({ emailId }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<AttachmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const data = await api.get<AttachmentResponse[]>(`/attachments/list/${emailId}`)
        setAttachments(data)
      } catch {
        setAttachments([])
      } finally {
        setLoading(false)
      }
    }
    fetchAttachments()
  }, [emailId])

  const handleDownload = async (att: AttachmentResponse) => {
    setDownloading(att.id)
    try {
      const blob = await api.download(`/attachments/download/${att.id}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = att.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Téléchargement échoué', err)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return null
  if (attachments.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
        <Paperclip className="w-3.5 h-3.5" />
        {attachments.length} pièce{attachments.length > 1 ? 's' : ''} jointe{attachments.length > 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950 rounded-lg flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{att.filename}</p>
              <p className="text-xs text-gray-400">{formatFileSize(att.size_bytes)}</p>
            </div>
            <button
              onClick={() => handleDownload(att)}
              disabled={downloading === att.id}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors disabled:opacity-50"
              title="Télécharger"
              aria-label={`Télécharger ${att.filename}`}
            >
              {downloading === att.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}