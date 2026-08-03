"use client"

import { useEffect, useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SourceCitation } from "@/features/ai/components/source-citation"
import type { ChatMessage } from "@/features/ai/types/ai-types"
import { cn } from "@/lib/utils"

type MessageListProps = {
  messages: ChatMessage[]
  isLoading?: boolean
}

function roleLabel(role: ChatMessage["role"]) {
  if (role === "user") return "You"
  if (role === "assistant") return "Assistant"
  return "System"
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium tracking-tight">Ask about this property</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Answers are grounded in your uploaded knowledge documents. Streaming,
          voice, and WhatsApp channels can plug in later without changing this
          layout.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[min(60vh,32rem)] rounded-lg border border-border">
      <ul className="space-y-4 p-4">
        {messages.map((message) => {
          const isUser = message.role === "user"
          const isSystem = message.role === "system"

          return (
            <li
              key={message.id}
              className={cn(
                "flex",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] space-y-2 rounded-lg px-3 py-2 text-sm",
                  isUser && "bg-primary text-primary-foreground",
                  message.role === "assistant" &&
                    !message.error &&
                    "bg-muted text-foreground",
                  message.error && "bg-destructive/10 text-destructive",
                  isSystem && "w-full bg-transparent text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isUser ? "secondary" : "outline"}
                    className={cn(isUser && "border-transparent bg-white/15 text-inherit")}
                  >
                    {roleLabel(message.role)}
                  </Badge>
                  {message.pending ? (
                    <span className="text-[10px] opacity-70">Thinking…</span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {message.pending && !message.content
                    ? "Retrieving knowledge and composing an answer…"
                    : message.content}
                </p>
                {message.sources && message.sources.length > 0 ? (
                  <SourceCitation sources={message.sources} />
                ) : null}
              </div>
            </li>
          )
        })}
        <div ref={endRef} />
      </ul>
    </ScrollArea>
  )
}
