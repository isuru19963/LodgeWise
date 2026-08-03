import { apiClient } from "@/lib/api-client"
import type {
  ChatRequest,
  ChatResponse,
  ChatSource,
} from "@/features/ai/types/ai-types"

function parseSources(raw: unknown): ChatSource[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    return {
      document_id: String(row.document_id ?? ""),
      document_title: String(row.document_title ?? "Untitled"),
      content: String(row.content ?? ""),
      score: Number(row.score ?? 0),
    }
  })
}

function parseChatResponse(data: unknown): ChatResponse {
  const row = data as Record<string, unknown>
  return {
    answer: String(row.answer ?? ""),
    sources: parseSources(row.sources),
    conversation_id: String(row.conversation_id ?? ""),
    model: String(row.model ?? "unknown"),
  }
}

export const aiService = {
  /**
   * Non-streaming chat. Auth + tenant isolation handled by apiClient + backend JWT.
   * Streaming can later swap this for EventSource / fetch body reader without
   * changing call sites that consume ChatResponse.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const data = await apiClient<unknown>("/ai/chat", {
      method: "POST",
      body: {
        message: request.message.trim(),
        property_id: request.property_id,
        conversation_id: request.conversation_id ?? null,
        guest_id: request.guest_id ?? null,
        channel: request.channel ?? "in_app",
      },
    })
    return parseChatResponse(data)
  },
}
