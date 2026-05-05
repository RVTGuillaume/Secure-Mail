export interface UserResponse {
  id: string
  email: string
  username: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface EmailResponse {
  id: string
  user_id: string
  folder: string
  from_address: string
  to_addresses: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body_text: string
  body_html: string | null
  reply_to_id: string | null
  labels: string[]
  is_read: boolean
  is_starred: boolean
  is_deleted: boolean
  attachment_ids: string[]
  created_at: string
  updated_at: string
}

export interface EmailListResponse {
  total: number
  page: number
  per_page: number
  emails: EmailResponse[]
}

export interface AttachmentResponse {
  id: string
  user_id: string
  email_id: string
  filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

export interface PGPKeyResponse {
  id: string
  user_id: string
  public_key: string
  fingerprint: string
  key_id: string
  created_at: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface ApiError {
  detail: string
}

export type Folder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive'

export interface ComposeData {
  to_addresses: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body_text: string
  body_html?: string
  reply_to_id?: string
  labels: string[]
  encrypt: boolean
}