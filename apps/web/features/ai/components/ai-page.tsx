"use client"

import { Header } from "@/components/layout/header"
import { PageShell } from "@/components/shared/page"
import { ChatWindow } from "@/features/ai/components/chat-window"

export function AiPageContent() {
  return (
    <PageShell>
      <Header
        title="AI Assistant"
        description="Property knowledge chat grounded in your documents. Uses the stub or configured LLM via the API — no keys in the browser."
      />
      <ChatWindow />
    </PageShell>
  )
}
