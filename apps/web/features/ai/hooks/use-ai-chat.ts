"use client"

import { useMutation } from "@tanstack/react-query"
import { useCallback, useState } from "react"

import { aiService } from "@/features/ai/services/ai-service"
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from "@/features/ai/types/ai-types"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api-client"

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nowIso() {
  return new Date().toISOString()
}

export function useAiChat(propertyId: string | null) {
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (request: ChatRequest) => aiService.chat(request),
  })

  const resetConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || !propertyId || !isAuthenticated) return

      setError(null)

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        createdAt: nowIso(),
      }

      const pendingId = createId()
      const pendingAssistant: ChatMessage = {
        id: pendingId,
        role: "assistant",
        content: "",
        createdAt: nowIso(),
        pending: true,
      }

      setMessages((prev) => [...prev, userMessage, pendingAssistant])

      try {
        const response: ChatResponse = await mutation.mutateAsync({
          message: trimmed,
          property_id: propertyId,
          conversation_id: conversationId,
          channel: "in_app",
        })

        setConversationId(response.conversation_id)
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  content: response.answer,
                  sources: response.sources,
                  pending: false,
                }
              : message
          )
        )
      } catch (err) {
        const detail =
          err instanceof ApiError
            ? err.detail
            : "Could not reach the AI assistant. Try again."
        setError(detail)
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  content: detail,
                  pending: false,
                  error: true,
                }
              : message
          )
        )
      }
    },
    [propertyId, isAuthenticated, conversationId, mutation]
  )

  return {
    messages,
    conversationId,
    error,
    isLoading: mutation.isPending,
    sendMessage,
    resetConversation,
    canSend: Boolean(propertyId) && isAuthenticated && !mutation.isPending,
  }
}
