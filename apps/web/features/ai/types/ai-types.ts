/**
 * Provider-agnostic AI chat types.
 * Streaming / voice / WhatsApp channels are prepared here but not wired yet.
 */

export type MessageRole = "user" | "assistant" | "system"

/** Future channels: voice, whatsapp — keep API channel values aligned with backend. */
export type ConversationChannel =
  | "in_app"
  | "email"
  | "sms"
  | "whatsapp"
  | "api"

export type ChatSource = {
  document_id: string
  document_title: string
  content: string
  score: number
}

export type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  sources?: ChatSource[]
  createdAt: string
  /** When true, message is a local optimistic / streaming placeholder. */
  pending?: boolean
  error?: boolean
}

export type ChatRequest = {
  message: string
  property_id: string
  conversation_id?: string | null
  guest_id?: string | null
  channel?: ConversationChannel
}

export type ChatResponse = {
  answer: string
  sources: ChatSource[]
  conversation_id: string
  model: string
}

/** Reserved for future SSE / chunked streaming. */
export type ChatStreamEvent =
  | { type: "token"; content: string }
  | { type: "sources"; sources: ChatSource[] }
  | { type: "done"; conversation_id: string; model: string }
  | { type: "error"; detail: string }
