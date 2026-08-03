"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MessageInput } from "@/features/ai/components/message-input"
import { MessageList } from "@/features/ai/components/message-list"
import { useAiChat } from "@/features/ai/hooks/use-ai-chat"
import { useProperties } from "@/hooks/use-properties"

export function ChatWindow() {
  const propertiesQuery = useProperties()
  const properties = propertiesQuery.data ?? []
  const [propertyId, setPropertyId] = useState("")

  const {
    messages,
    conversationId,
    error,
    isLoading,
    sendMessage,
    resetConversation,
    canSend,
  } = useAiChat(propertyId || null)

  useEffect(() => {
    if (!propertyId && properties.length === 1) {
      setPropertyId(properties[0].id)
    }
  }, [properties, propertyId])

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Property assistant</CardTitle>
            <CardDescription>
              Provider-agnostic RAG chat scoped to one property. Organization
              isolation is enforced by the API.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetConversation}
            disabled={messages.length === 0 && !conversationId}
          >
            New conversation
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-property">Property</Label>
          <select
            id="ai-property"
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={propertyId}
            onChange={(event) => {
              setPropertyId(event.target.value)
              resetConversation()
            }}
            disabled={propertiesQuery.isLoading}
          >
            <option value="">Select a property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          {propertiesQuery.isError ? (
            <p className="text-xs text-destructive">
              Could not load properties.
            </p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <MessageList messages={messages} isLoading={isLoading} />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {conversationId ? (
          <p className="text-[11px] text-muted-foreground">
            Conversation {conversationId.slice(0, 8)}… · ready for streaming /
            voice / WhatsApp adapters later
          </p>
        ) : null}

        <MessageInput
          onSend={sendMessage}
          disabled={!canSend}
          placeholder={
            propertyId
              ? "Ask about check-in, amenities, policies…"
              : "Select a property to start chatting"
          }
        />
      </CardContent>
    </Card>
  )
}
